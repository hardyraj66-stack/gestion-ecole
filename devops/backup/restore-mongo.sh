#!/usr/bin/env bash
# Restauration MongoDB (Ekolova) depuis une archive .gz produite par backup-mongo.sh.
# Usage : ./restore-mongo.sh <chemin-archive.gz>
# ⚠️ --drop : les collections existantes sont REMPLACÉES par le contenu de l'archive.
set -euo pipefail

PROJECT_DIR="/home/ubuntu/ekolova"
cd "$PROJECT_DIR"

archive="${1:-}"
if [ -z "$archive" ] || [ ! -f "$archive" ]; then
  echo "Usage : $0 <chemin-archive.gz>"
  echo "Archives locales disponibles :"
  ls -1t "${PROJECT_DIR}/backup/dumps"/*.gz 2>/dev/null || echo "  (aucune)"
  exit 1
fi

set -a
# shellcheck disable=SC1091
. "${PROJECT_DIR}/.env"
set +a
DB="${MONGO_DB:-gestion-ecole}"
AUTH_DB="${MONGO_AUTH_SOURCE:-admin}"

if ! gzip -t "$archive" 2>/dev/null; then
  echo "ERREUR : '$archive' n'est pas une archive gzip valide."
  exit 1
fi

echo "⚠️  Restauration de la base '${DB}' depuis : ${archive}"
echo "    Les collections existantes seront REMPLACÉES (--drop)."
read -r -p "Confirmer ? Taper 'oui' : " ans
[ "$ans" = "oui" ] || { echo "Annulé."; exit 1; }

gunzip -c "$archive" | docker compose exec -T mongo mongorestore \
  --username "$MONGO_ROOT_USER" --password "$MONGO_ROOT_PASSWORD" \
  --authenticationDatabase "$AUTH_DB" --drop --archive

echo "Restauration terminée."
