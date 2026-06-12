# Architecture de déploiement — Ekolova

> Documentation de l'infrastructure de production et de la chaîne CI/CD.
> Application **Ekolova** (gestion scolaire) : frontend React + Vite, backend NestJS + MongoDB.
> **En ligne :** https://ekolova.duckdns.org

---

## 1. Vue d'ensemble

L'application tourne sur **une seule VM** (Oracle Cloud Always Free) sous forme de **3 conteneurs Docker** orchestrés par `docker compose`. Un reverse-proxy **Caddy** termine le HTTPS et relaie tout vers un conteneur **NestJS** qui sert à la fois l'**API**, le **frontend** (build mono-fichier) et le **WebSocket** (Socket.IO). Les données vivent dans **MongoDB**, non exposé à l'extérieur.

Le **déploiement est automatique** : tout merge sur `main` déclenche un workflow GitHub Actions qui se connecte en SSH à la VM, récupère le code et reconstruit les conteneurs.

```
                                 Internet
                                    │
                          HTTPS (443) / HTTP (80)
                                    │
        ┌───────────────────────────────────────────────────┐
        │                  VM Oracle Cloud                    │
        │              (VM.Standard.E2.1.Micro)               │
        │            1 OCPU · 1 Go RAM · 4 Go swap            │
        │                                                     │
        │   ┌──────────── réseau Docker interne ──────────┐   │
        │   │                                             │   │
        │   │   ┌─────────┐   ┌─────────┐   ┌──────────┐  │   │
        │  80/443 │ Caddy  │──▶│   app   │──▶│  mongo   │  │   │
        │   │   │ :2-alp  │   │ Nest    │   │  :7      │  │   │
        │   │   │ (HTTPS) │   │ :3000   │   │ :27017   │  │   │
        │   │   └─────────┘   └─────────┘   └──────────┘  │   │
        │   │       │              │              │       │   │
        │   └───────┼──────────────┼──────────────┼───────┘   │
        │      caddy-data     (sans volume)   mongo-data       │
        │      caddy-config                   (persistant)     │
        └───────────────────────────────────────────────────┘
```

---

## 2. Infrastructure

| Élément | Valeur |
|---|---|
| Fournisseur | Oracle Cloud Infrastructure (OCI) — **Always Free** |
| Forme (shape) | `VM.Standard.E2.1.Micro` (AMD, **toujours gratuite**) |
| Ressources | 1 OCPU · **1 Go RAM** · 4 Go swap (ajouté) · disque boot ~47 Go |
| OS | Ubuntu (user `ubuntu`) |
| IP publique | `130.162.241.147` |
| Domaine | `ekolova.duckdns.org` — sous-domaine **DuckDNS** gratuit (record A → IP) |
| Accès | SSH par clé : `ssh -i ~/.ssh/ekolova.key ubuntu@130.162.241.147` |
| Répertoire app | `~/ekolova` (clone git du dépôt, suit la branche `main`) |

> **Domaine (DuckDNS).** Le sous-domaine `ekolova.duckdns.org` est géré dans le compte DuckDNS (gratuit) ; son record A pointe vers l'IP de la VM. Mise à jour si l'IP change : `curl "https://www.duckdns.org/update?domains=ekolova&token=<TOKEN>&ip=<IP>"` (le token vit dans le compte DuckDNS, **pas dans le dépôt**). Pour changer de domaine, il suffit de modifier `SITE_ADDRESS` dans le `.env` racine (aucune URL en dur — le front suit `window.location.origin`). L'ancienne URL `…sslip.io` ne sert plus.

> **Pourquoi cette forme :** `E2.1.Micro` (AMD) est *toujours* disponible dans le free tier, contrairement aux formes Ampere `A1.Flex` (ARM) souvent en « out of capacity ». Elle se trouve dans l'onglet **« Specialty and previous generation »** de la console OCI.

> **Contrainte clé : 1 Go de RAM.** D'où le **swap de 4 Go** (builds gourmands) et la limite du **cache WiredTiger de Mongo à 0,25 Go**.

---

## 3. Les 3 conteneurs

Définis dans [`docker-compose.yml`](../docker-compose.yml).

### `caddy` — reverse-proxy + HTTPS
- Image `caddy:2-alpine`. **Seul conteneur exposé** (ports `80` et `443`).
- Termine le **TLS** : obtient et renouvelle automatiquement un certificat **Let's Encrypt** dès que `SITE_ADDRESS` est un domaine (ici via le challenge **TLS-ALPN-01** sur le 443).
- Redirige automatiquement **HTTP → HTTPS** (308).
- Relaie tout vers `app:3000` (`reverse_proxy`), y compris l'**upgrade WebSocket** (Socket.IO) géré nativement.
- **En-têtes de sécurité** ajoutés à toutes les réponses (PR #13) : `Strict-Transport-Security` (HSTS 1 an), `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy`, `Permissions-Policy`, une **CSP** (autorise `'unsafe-inline'` car le front est un HTML mono-bloc, + `fonts.googleapis/gstatic` pour la police Inter), et masque l'en-tête `Server`. Voir §6.
- Config : [`Caddyfile`](../Caddyfile) (monté en lecture seule). Certificats persistés dans le volume `caddy-data`.

### `app` — API + Frontend + WebSocket (NestJS)
- Image construite localement via le [`Dockerfile`](../Dockerfile) multi-étapes (voir §4).
- **Pas de port exposé** à l'hôte : joignable uniquement par Caddy via le réseau Docker.
- En production (`NODE_ENV=production`) :
  - préfixe global **`/api`** sur toutes les routes REST (`app.setGlobalPrefix('api')`) ;
  - sert le **frontend** (fichier HTML mono-bloc Vite) via `ServeStaticModule` ;
  - **refuse de démarrer** si `JWT_SECRET` absent **ou < 32 caractères** (PR #13) ;
  - le **seeding de démo** est ignoré sauf `SEED_DEMO=true` (prod : `false`).
- **Durcissement applicatif** (PR #13) : middleware anti-injection NoSQL (strip des clés `$`/`.`), limiteur d'auth par IP ciblé (login/forgot/reset), `trust proxy` (IP réelle derrière Caddy), WebSocket qui revérifie le compte en base à la connexion. Voir §6.
- Variables : `env_file: ./server/.env` + surcharges `NODE_ENV`, `PORT=3000`, et `MONGO_URI` **à identifiants** assemblé depuis les variables du `.env` racine (voir §8).

### `mongo` — base de données
- Image `mongo:7`. **Pas de port exposé** (accessible seulement par `app` sur le réseau Docker interne).
- `--wiredTigerCacheSizeGB 0.25` (adapté à 1 Go de RAM).
- **Authentification activée** (`--auth`, PR #14) : deux comptes dans la base `admin` — `ekolova_root` (role `root`, maintenance) et `ekolova_app` (`readWrite`+`dbAdmin` **sur la seule base `gestion-ecole`**, utilisé par l'API). Défense en profondeur, voir §6.
- `mongo-init.js` (monté dans `/docker-entrypoint-initdb.d/`) crée le compte applicatif limité **à l'initialisation d'un volume vierge** uniquement.
- Reste **standalone** (pas de replica set → pas de keyfile ; les Change Streams sont en best-effort/fallback).
- Données persistées dans le volume `mongo-data`.

---

## 4. Build Docker (image `app`)

[`Dockerfile`](../Dockerfile) — **multi-étapes** pour une image runtime légère :

```
1) frontend       node:20-alpine   npm ci + vite build      → /fe/dist (HTML mono-fichier)
2) server-build   node:20-alpine   npm ci + tsc             → /srv/dist (JS compilé)
3) runtime        node:20-alpine   npm ci --omit=dev        → image finale
                                    + COPY dist (server)
                                    + COPY dist (frontend) → ./public
                                    CMD node dist/main.js
```

Points importants :
- **`tsconfig.tsbuildinfo` ne doit jamais être committé** (ni présent dans le contexte) : le cache incrémental TypeScript fait sauter à `tsc` l'émission de fichiers « inchangés » et produit un `dist/` partiel → crash `Cannot find module …`. D'où l'ignore (`.gitignore`, `.dockerignore`) **et** le `rm -f tsconfig.tsbuildinfo` défensif avant `tsc`.
- `.dockerignore` exclut `node_modules`, `dist`, `.env`, `.git`, `.github`, `docs`, `specs`, etc. du contexte de build.
- Le frontend est **bundlé dans un seul HTML** (`vite-plugin-singlefile`) puis copié dans `app/public` et servi par Nest → **même origine** que l'API (pas de CORS cross-domaine en prod).

**Durées indicatives** (sur cette VM 1 Go) :
| Cas | Durée |
|---|---|
| Aucun changement de code (couches en cache) | ~30–60 s |
| Changement de code (`package.json` inchangés) | ~4–8 min |
| Build à froid / lock modifié | ~8–12 min |

À chaque rebuild, le conteneur `app` est recréé → **~30 s de HTTP 502** le temps du redémarrage (mapping des routes + reconstruction des read models).

---

## 5. Flux d'une requête

```
Navigateur ──HTTPS──▶ Caddy:443 ──http──▶ app:3000 ──┬─▶  /api/*        → contrôleurs NestJS
   (wss pour            (TLS,            (réseau      │    /socket.io/*  → gateway Socket.IO
    Socket.IO)          gzip)            Docker)      └─▶  tout le reste → frontend (public/index.html)
                                                              │
                                                       app ──▶ mongo:27017 (lecture/écriture)
```

- **Frontend & API = même origine** (`https://ekolova.duckdns.org`). Le front appelle `/api` et le socket sur `window.location.origin` (voir `frontend/src/config/api.ts`).
- Le **temps réel** (mises à jour live, **présence « en ligne »** des comptes) passe par le même canal WebSocket relayé par Caddy.

---

## 6. Réseau & sécurité

**Deux pare-feux distincts à ouvrir** pour exposer 80/443 :
1. **Security List du VCN** (pare-feu cloud OCI, console web) — règles *ingress* : Source CIDR `0.0.0.0/0`, **Destination** Port Range `80` et `443`, protocole TCP.
2. **iptables de l'OS** (Ubuntu) — règles `ACCEPT` sur 80/443.

Surface d'exposition minimale :
- Seuls **80/443** sont ouverts au public (Caddy). Caddy redirige 80 → 443. (Vérifié de l'extérieur : `27017` et `111` fermés/filtrés.)
- **`app:3000` et `mongo:27017` ne sont PAS exposés** à l'hôte ni à Internet : uniquement joignables sur le réseau Docker interne.
- **MongoDB avec authentification** (`--auth`, PR #14) : même si le port reste interne, l'accès sans identifiants est désormais **refusé** (`Unauthorized`). Compte applicatif `ekolova_app` à privilèges limités (readWrite+dbAdmin sur `gestion-ecole` uniquement) → une compromission de l'app ne donne pas un accès libre à toute la base. (Pour s'y connecter en maintenance : SSH sur la VM puis `docker compose exec mongo mongosh -u ekolova_root -p '<MONGO_ROOT_PASSWORD>' --authenticationDatabase admin`.)
- **Secrets** : `JWT_SECRET`, `SMTP_PASS`, les mots de passe Mongo, etc. vivent dans les `.env` sur la VM (`~/ekolova/.env` et `~/ekolova/server/.env`, **gitignorés**, jamais committés). La clé SSH de déploiement est un **secret GitHub** (voir §7).
- **Le code source est présent** sur la VM (`~/ekolova`, nécessaire au build) mais **non servi par Caddy** : inaccessible depuis Internet, seulement via SSH.

### Durcissement applicatif & en-têtes (PR #13)

| Couche | Mesure |
|---|---|
| Caddy (réponses HTTP) | HSTS (1 an), `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy`, `Permissions-Policy`, **CSP**, en-tête `Server` masqué |
| NestJS — entrée | Middleware **anti-injection NoSQL** (supprime les clés `$`/`.` de `body`/`query`/`params`) |
| NestJS — auth | **Limiteur par IP ciblé** sur `login`/`forgot-password`/`reset-password` (pas global : une école partage souvent une IP) ; anti brute-force par identifiant ; `trust proxy` pour l'IP réelle derrière Caddy |
| NestJS — boot | Refus de démarrer en prod si `JWT_SECRET` absent ou < 32 caractères |
| WebSocket | À la connexion, le compte est **revérifié en base** (inactif / archivé / session révoquée → socket refusé), parité avec le guard HTTP |
| Mongo | Authentification activée + compte applicatif à moindre privilège (ci-dessus) |

> **Résiduel connu :** le jeton JWT est stocké côté front en `localStorage` (risque XSS, atténué par la CSP) — un passage en cookie `httpOnly` reste un refactor à part. Le compte admin par défaut a vu son mot de passe `admin123` réinitialisé en prod.

---

## 7. CI/CD — déploiement automatique

### Pipeline
```
   Merge / push sur main (GitHub)
              │
              ▼
   .github/workflows/deploy.yml  (GitHub Actions, runner ubuntu-latest)
              │   appleboy/ssh-action  (SSH vers la VM)
              ▼
   Sur la VM, dans ~/ekolova :
     git fetch origin main
     git checkout -B main origin/main        # aligne la VM sur origin/main
     docker compose up -d --build            # rebuild + redémarre ce qui a changé
     docker image prune -f                   # nettoie les images orphelines
              │
              ▼
   Site à jour en ligne (après ~30 s de redémarrage)
```

Fichier : [`.github/workflows/deploy.yml`](../.github/workflows/deploy.yml).
- Déclencheurs : **push sur `main`** + **`workflow_dispatch`** (déclenchement manuel depuis l'onglet Actions).
- `concurrency: deploy-production` avec `cancel-in-progress: false` → **jamais deux déploiements concurrents**, ni d'interruption d'un déploiement en cours.
- `command_timeout: 30m` (le build sur 1 Go peut être long).

### Secrets GitHub requis (déjà configurés)
| Secret | Contenu |
|---|---|
| `VM_HOST` | `130.162.241.147` |
| `VM_USER` | `ubuntu` |
| `VM_SSH_KEY` | contenu de la clé privée `~/.ssh/ekolova.key` |

### CI de validation (séparée)
[`.github/workflows/ci.yml`](../.github/workflows/ci.yml) (« CI — Build Check ») construit frontend & backend sur push/PR.
⚠️ Le job **E2E (Playwright) est cassé** (`nodemon: not found` dans le `webServer` Playwright) — rouge de longue date sur `main`, **indépendant du déploiement**. Les PR sont mergées avec `--admin`. À corriger un jour.

---

## 8. Configuration & variables d'environnement

| Fichier (sur la VM) | Rôle | Versionné ? |
|---|---|---|
| `~/ekolova/.env` | `SITE_ADDRESS=ekolova.duckdns.org` (Caddy) **+ variables Mongo** : `MONGO_HOST/PORT/DB/AUTH_SOURCE`, `MONGO_ROOT_USER/PASSWORD`, `MONGO_USER/PASSWORD` | ❌ gitignoré |
| `~/ekolova/server/.env` | `NODE_ENV`, `JWT_SECRET` (≥ 32 car.), `CORS_ORIGIN`, `APP_URL` (= `https://ekolova.duckdns.org`), `SEED_DEMO=false`, `SMTP_*` | ❌ gitignoré |
| `docker-compose.yml` | surcharge `NODE_ENV`, `PORT` ; **assemble `MONGO_URI` à identifiants** depuis les variables du `.env` racine ; passe `MONGO_INITDB_ROOT_*` + `MONGO_APP_*` à mongo | ✅ |
| `.env.example` (racine) | documente les variables Caddy + Mongo (sans secrets) | ✅ |

Ces fichiers `.env` **survivent aux `git pull`** (gitignorés) → la config de prod n'est jamais écrasée par un déploiement. Les variables du `.env` racine sont interpolées par `docker-compose` (ex. `MONGO_URI=mongodb://${MONGO_USER}:${MONGO_PASSWORD}@${MONGO_HOST}:${MONGO_PORT}/${MONGO_DB}?authSource=${MONGO_AUTH_SOURCE}`).

---

## 9. Persistance des données

| Volume Docker | Contenu | Criticité |
|---|---|---|
| `mongo-data` | toute la base `gestion-ecole` | 🔴 **critique** — à sauvegarder |
| `caddy-data` | certificats Let's Encrypt + comptes ACME | 🟠 regénérables (mais évite de re-solliciter Let's Encrypt) |
| `caddy-config` | config runtime Caddy | 🟢 regénérable |

Les volumes **survivent** à la recréation des conteneurs et aux déploiements. Ils ne sont supprimés que par un `docker volume rm` explicite (ou `docker compose down -v`).

> 💾 **Sauvegarde Mongo** : cron quotidien (03:30) `mongodump` → gzip local (`~/ekolova/backup/dumps/`, rotation 14 j) + upload Object Storage si `BACKUP_PAR_URL` est défini. Scripts et procédure dans [backup/README.md](backup/README.md). **Reste à activer la copie hors-VM** (créer bucket + PAR dans la console OCI, puis renseigner `BACKUP_PAR_URL`) — tant que ce n'est pas fait, la sauvegarde est **locale uniquement** et ne protège pas d'une perte de disque/VM.

---

## 10. Opérations courantes (runbook)

Toutes depuis la VM (`ssh -i ~/.ssh/ekolova.key ubuntu@130.162.241.147`, puis `cd ~/ekolova`) :

```bash
# État des conteneurs
docker compose ps

# Logs (live) de l'app
docker compose logs app -f --tail=50

# Redéployer manuellement (équivalent du workflow)
git fetch origin main && git checkout -B main origin/main && docker compose up -d --build

# Redémarrer sans rebuild
docker compose restart app

# Accès à la base (auth activée — identifiants depuis le .env racine)
source ~/ekolova/.env
docker compose exec mongo mongosh -u "$MONGO_ROOT_USER" -p "$MONGO_ROOT_PASSWORD" \
  --authenticationDatabase admin gestion-ecole
# ex : db.users.find()  /  show collections

# Sauvegarde Mongo (dump dans le conteneur puis copie locale)
source ~/ekolova/.env
docker compose exec -T mongo mongodump -u "$MONGO_ROOT_USER" -p "$MONGO_ROOT_PASSWORD" \
  --authenticationDatabase admin --db gestion-ecole --archive | gzip > ~/backup-$(date +%F).gz

# Réinitialiser entièrement la base (⚠️ efface tout, le seeder repeuplera)
# Volume vierge → mongo-init.js recrée automatiquement le compte applicatif
# à partir des variables MONGO_* du .env racine.
docker compose down
docker volume rm ekolova_mongo-data
docker compose up -d
```

Déclenchement manuel du déploiement depuis GitHub : onglet **Actions → Deploy — Oracle Cloud → Run workflow**.

---

## 11. Limites connues & améliorations possibles

- **Mono-instance / SPOF** : une seule VM, un seul conteneur de chaque. Pas de haute dispo. (Cohérent avec l'objectif « gratuit ».)
- **~30 s d'indisponibilité (HTTP 502) à chaque déploiement** — le conteneur `app` est recréé. Atténuable avec un healthcheck + stratégie de redémarrage progressive.
- **Build sur la VM (1 Go RAM)** : lent. *Alternative* : construire l'image dans GitHub Actions, la pousser sur un registre (GHCR), la VM fait juste `docker pull` + `up` → déploiement plus rapide **et** plus de code source sur la VM.
- **Sauvegarde Mongo** : cron `mongodump` quotidien en place (gzip local + rotation 14 j, cf. [backup/README.md](backup/README.md)). **Copie hors-VM à activer** : créer bucket + PAR Object Storage (console OCI) puis renseigner `BACKUP_PAR_URL` — sinon la sauvegarde reste locale (même disque que la base).
- **Jeton en `localStorage`** (front) : risque XSS résiduel, atténué par la CSP ; passage en cookie `httpOnly` = refactor à part.
- **CI E2E rouge** (`nodemon: not found`) : installer les devDeps du serveur dans le job e2e, ou adapter la commande `webServer` de Playwright.
- **Présence multi-instance** : si on scale horizontalement un jour, le WebSocket aura besoin de l'adaptateur **Redis** de Socket.IO.

---

*Dernière mise à jour : 2026-06-12.*
