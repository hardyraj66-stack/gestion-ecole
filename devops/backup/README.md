# 💾 Sauvegarde des données — Ekolova

> **En une phrase :** chaque nuit, l'application se copie toute seule, garde les
> copies récentes sur le serveur **et** en dépose une dans un coffre Oracle séparé.
> Si un jour les données sont perdues, on peut les remettre comme elles étaient.

Statut : ✅ **en place et testé** (12 juin 2026).

---

## 1. Pourquoi

Toutes les données (élèves, notes, comptes…) vivent dans **un seul** endroit : la base
MongoDB, sur le disque de la VM. Sans sauvegarde, un disque mort, une VM supprimée ou une
fausse manip = **perte totale, sans retour possible**.

La sauvegarde fait une **photocopie** régulière et la range **ailleurs**.

---

## 2. Comment ça marche (vue simple)

```
   Chaque nuit à 03 h 30
            │
            ▼
   ┌──────────────────┐   1. copie toute la base (mongodump)
   │  backup-mongo.sh │   2. la compresse (gzip, < 1 Mo)
   └────────┬─────────┘   3. la range avec la date du jour
            │
      ┌─────┴───────────────────────┐
      ▼                             ▼
 Copie LOCALE                 Copie DISTANTE
 sur la VM                    dans le coffre Oracle
 ~/ekolova/backup/dumps/      (bucket "ekolova-backups")
 → 14 derniers jours          → autre site qu'à la VM
```

- **Copie locale** : protège des erreurs courantes (suppression, mauvaise mise à jour) →
  on ressort la copie de la veille.
- **Copie distante** (Object Storage Oracle) : protège même si **toute la VM** disparaît.

---

## 3. Ce qui est installé

| Élément | Détail |
|---|---|
| **Quand** | Tous les jours à **03 h 30** (tâche `cron` de l'utilisateur `ubuntu`) |
| **Script** | `~/ekolova/backup/backup-mongo.sh` |
| **Copies locales** | `~/ekolova/backup/dumps/` — gardées **14 jours** (`BACKUP_RETENTION_DAYS`) |
| **Copie distante** | Bucket OCI `ekolova-backups` (région *Frankfurt*, namespace `frx8l52ib3id`) |
| **Comment l'envoi se fait** | Pre-Authenticated Request (**PAR**) en écriture — pas de clé API sur la VM |
| **Journal** | `~/ekolova/backup/backup.log` (et `cron.log` pour les exécutions nocturnes) |
| **Restauration** | `~/ekolova/backup/restore-mongo.sh` |
| **Nom des fichiers** | `ekolova-gestion-ecole-AAAA-MM-JJ_HHMMSS.gz` |

> La copie distante coûte **0 €** : Object Storage Oracle offre 10 Go gratuits, une
> sauvegarde fait < 1 Mo.

---

## 4. Vérifier que ça marche

**Côté serveur** (voir les dernières exécutions) :
```bash
ssh -i ~/.ssh/ekolova.key ubuntu@130.162.241.147
tail -n 15 ~/ekolova/backup/backup.log
```
On doit voir, pour la dernière nuit, trois lignes du type :
```
Dump OK (772K)
Upload Object Storage OK → ekolova-gestion-ecole-...gz
Terminé (N archive(s) locale(s)).
```

**Côté Oracle** (preuve visuelle) :
Console OCI → bucket **ekolova-backups** → onglet **Objects** → on voit un fichier `.gz`
par jour.

**Forcer une sauvegarde tout de suite** (sans attendre la nuit) :
```bash
~/ekolova/backup/backup-mongo.sh
```

---

## 5. Restaurer les données

> ⚠️ La restauration **remplace** les données actuelles par celles de la copie choisie
> (option `--drop`). Le script demande une confirmation explicite (taper `oui`).

```bash
ssh -i ~/.ssh/ekolova.key ubuntu@130.162.241.147

# Voir les copies locales disponibles (la commande sans argument les liste)
~/ekolova/backup/restore-mongo.sh

# Restaurer une date précise
~/ekolova/backup/restore-mongo.sh ~/ekolova/backup/dumps/ekolova-gestion-ecole-2026-06-12_031500.gz
```

**Restaurer depuis le coffre Oracle** (si les copies locales ne sont plus là) :
télécharger l'objet `.gz` depuis la console (onglet *Objects* → ⋮ → *Download*), le déposer
sur la VM (`scp`), puis lancer `restore-mongo.sh` sur ce fichier.

---

## 6. Entretien (rare)

### Renouveler la clé du coffre (PAR) — **dans ~2 ans**
La PAR a une date d'expiration. Quand elle expire, l'envoi distant échoue (la sauvegarde
locale, elle, continue). Pour la renouveler :

1. Console OCI → bucket `ekolova-backups` → onglet **Management** →
   **Pre-authenticated requests** → **Create pre-authenticated request**.
2. *Target* = **Bucket**, *Access type* = **Permit object writes**, expiration lointaine.
3. Copier l'URL affichée (une seule fois).
4. La remettre dans `~/ekolova/.env` :
   ```
   BACKUP_PAR_URL=https://objectstorage.eu-frankfurt-1.oraclecloud.com/p/…/o/
   ```
5. Tester : `~/ekolova/backup/backup-mongo.sh` puis `tail ~/ekolova/backup/backup.log`.

### Changer la durée de conservation locale
Modifier `BACKUP_RETENTION_DAYS` dans `~/ekolova/.env` (ex. `30`).

---

## 7. En cas de problème

| Symptôme (dans `backup.log`) | Cause probable / solution |
|---|---|
| `ERREUR mongodump` | Le conteneur `mongo` est arrêté, ou identifiants `MONGO_ROOT_*` du `.env` incorrects. Vérifier `docker compose ps`. |
| `BACKUP_PAR_URL non défini …` | La clé du coffre n'est pas (ou plus) renseignée dans `.env`. → §6. |
| `ERREUR upload Object Storage` | PAR expirée/supprimée, ou pas de réseau. La copie **locale** est conservée. → recréer la PAR (§6). |
| Rien dans `cron.log` le matin | La tâche cron a disparu. Vérifier `crontab -l` (doit contenir `backup-mongo.sh`). |

---

## 8. Détails techniques (référence)

- **Dump streamé** hors du conteneur puis compressé à la volée
  (`docker compose exec -T mongo mongodump --archive | gzip`) → faible empreinte mémoire,
  adapté à la VM 1 Go RAM.
- **Authentification Mongo** : MongoDB tourne en `--auth` ; les scripts utilisent
  `MONGO_ROOT_USER` / `MONGO_ROOT_PASSWORD` du `.env` racine (`authSource=admin`).
- **Sécurité de la PAR** : URL = capacité d'écriture seule sur le bucket. Elle vit
  **uniquement** dans `~/ekolova/.env` (gitignoré), jamais dans le dépôt Git.
- **Rétention** : locale = `BACKUP_RETENTION_DAYS` (script) ; distante = manuelle ou via
  une *lifecycle policy* du bucket si la console l'expose.
- **Intégrité** : chaque archive est vérifiée (`gzip -t`) avant l'upload ; si l'envoi
  distant échoue, l'archive locale n'est jamais supprimée.

### Fichiers
| Fichier | Rôle |
|---|---|
| `backup-mongo.sh` | Sauvegarde (cron) |
| `restore-mongo.sh` | Restauration |
| `README.md` | Ce document |
| `~/ekolova/.env` *(VM, non versionné)* | `BACKUP_PAR_URL`, `BACKUP_RETENTION_DAYS`, `MONGO_*` |

### Cron installé
```
30 3 * * * /home/ubuntu/ekolova/backup/backup-mongo.sh >> /home/ubuntu/ekolova/backup/cron.log 2>&1
```
