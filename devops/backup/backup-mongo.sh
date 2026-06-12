#!/usr/bin/env bash
# Sauvegarde MongoDB (Ekolova) — dump gzip local (avec rotation) + upload Object Storage (PAR).
# Conçu pour tourner en cron sur la VM. Aucune clé API : l'upload utilise une
# Pre-Authenticated Request (PAR) en écriture (URL dans BACKUP_PAR_URL du .env racine).
set -euo pipefail

PROJECT_DIR="/home/ubuntu/ekolova"
BACKUP_DIR="${PROJECT_DIR}/backup/dumps"
LOG_FILE="${PROJECT_DIR}/backup/backup.log"
RETENTION_DAYS_DEFAULT=14

cd "$PROJECT_DIR"

# Charger le .env racine (MONGO_* + config sauvegarde BACKUP_PAR_URL / BACKUP_RETENTION_DAYS).
set -a
# shellcheck disable=SC1091
. "${PROJECT_DIR}/.env"
set +a

DB="${MONGO_DB:-gestion-ecole}"
AUTH_DB="${MONGO_AUTH_SOURCE:-admin}"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-$RETENTION_DAYS_DEFAULT}"

mkdir -p "$BACKUP_DIR"
log() { echo "[$(date '+%F %T')] $*" | tee -a "$LOG_FILE"; }

ts="$(date +%F_%H%M%S)"
archive="${BACKUP_DIR}/ekolova-${DB}-${ts}.gz"

log "Début sauvegarde → $(basename "$archive")"

# Dump streamé hors du conteneur, compressé localement.
if docker compose exec -T mongo mongodump \
      --username "$MONGO_ROOT_USER" --password "$MONGO_ROOT_PASSWORD" \
      --authenticationDatabase "$AUTH_DB" --db "$DB" \
      --archive 2>>"$LOG_FILE" | gzip > "$archive"; then
  size="$(du -h "$archive" | cut -f1)"
  log "Dump OK (${size})"
else
  log "ERREUR mongodump — sauvegarde abandonnée"
  rm -f "$archive"
  exit 1
fi

# Vérif de cohérence : une archive gzip valide non vide.
if ! gzip -t "$archive" 2>/dev/null || [ ! -s "$archive" ]; then
  log "ERREUR archive corrompue ou vide — abandon"
  rm -f "$archive"
  exit 1
fi

# Upload Object Storage via PAR (si configuré).
if [ -n "${BACKUP_PAR_URL:-}" ]; then
  url="${BACKUP_PAR_URL%/}/$(basename "$archive")"
  if curl -fsS -T "$archive" "$url" >>"$LOG_FILE" 2>&1; then
    log "Upload Object Storage OK → $(basename "$archive")"
  else
    log "ERREUR upload Object Storage (archive locale conservée)"
  fi
else
  log "BACKUP_PAR_URL non défini → upload distant ignoré (sauvegarde locale seulement)"
fi

# Rotation locale (les copies distantes sont gérées par la lifecycle policy du bucket).
deleted="$(find "$BACKUP_DIR" -name '*.gz' -type f -mtime "+${RETENTION_DAYS}" -print -delete | wc -l)"
log "Rotation locale : ${deleted} archive(s) > ${RETENTION_DAYS} j supprimée(s)"
log "Terminé ($(find "$BACKUP_DIR" -name '*.gz' | wc -l) archive(s) locale(s))."
