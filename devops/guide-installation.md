# Guide d'installation manuelle — Ekolova en production

> **But :** reproduire **de zéro, à la main**, le déploiement décrit dans [`architecture.md`](./architecture.md) :
> une VM Oracle Always Free → 3 conteneurs Docker (Mongo + NestJS + Caddy) → HTTPS automatique → déploiement continu au merge sur `main`.
>
> **Légende des commandes :**
> 🖥️ = à exécuter **sur ta machine locale** · ☁️ = à exécuter **sur la VM** (après SSH).
>
> **Valeurs à adapter** (exemples utilisés ici) :
> - IP publique : `130.162.241.147`
> - Domaine : `ekolova.duckdns.org` (sous-domaine **DuckDNS** gratuit — création à l'étape 9)
> - Clé SSH : `~/.ssh/ekolova.key`
> - Dépôt : `https://github.com/<utilisateur>/<repo>.git`

---

## Prérequis

- Un compte **Oracle Cloud** (Always Free activé).
- Un compte **GitHub** + le dépôt de l'app.
- Sur ta machine locale : `ssh`, `git`, et le CLI **`gh`** (`gh auth login`) pour les secrets.

---

## Étape 1 — Créer la VM Oracle (Always Free)

Console OCI → **Compute → Instances → Create instance** :

1. **Image and shape → Change shape → onglet « Specialty and previous generation »** → choisir **`VM.Standard.E2.1.Micro`** (AMD, *Always Free-eligible*).
   - ⚠️ **Ne PAS** prendre `VM.Standard.E5.Flex` (payante) ni rester sur `A1.Flex` (Ampere, souvent « out of capacity »).
   - Si « not available in this AD » → changer le **Availability Domain** (essayer AD-1).
2. **Image** : Ubuntu (dernière LTS).
3. **Networking** : laisser créer un **VCN** + subnet publics, assigner une **IP publique**.
4. **SSH keys** : *Generate a key pair* → **télécharger la clé privée** (ou coller ta clé publique). Place la clé privée localement :
   ```bash
   # 🖥️
   mv ~/Downloads/ssh-key-*.key ~/.ssh/ekolova.key
   chmod 600 ~/.ssh/ekolova.key
   ```
5. **Create** → attendre l'état **Running**, noter l'**IP publique**.

---

## Étape 2 — Ouvrir les ports 80/443 dans le pare-feu cloud (VCN)

> Il y a **deux pare-feux** : celui du **VCN** (cette étape) **et** celui de l'**OS** (étape 4). Les deux doivent autoriser 80/443.

Console OCI → **Networking → Virtual Cloud Networks → ton VCN → Subnets → ton subnet → Security Lists → Default Security List → Add Ingress Rules**.

Créer **2 règles** (une pour 80, une pour 443) :

| Champ | Valeur |
|---|---|
| Stateless | non |
| Source Type | CIDR |
| Source CIDR | `0.0.0.0/0` |
| IP Protocol | TCP |
| Source Port Range | *(laisser vide)* |
| **Destination Port Range** | **`80`** (puis `443` pour la 2ᵉ règle) |

> ⚠️ Erreur classique : mettre le port dans **Source** Port Range. Le port d'écoute va dans **Destination** Port Range. Source Port Range reste **vide**.

---

## Étape 3 — Première connexion SSH

```bash
# 🖥️
ssh -i ~/.ssh/ekolova.key ubuntu@130.162.241.147
```

---

## Étape 4 — Préparer le système (swap, mise à jour, firewall OS)

```bash
# ☁️  — Swap 4 Go (indispensable : la VM n'a que 1 Go de RAM)
sudo fallocate -l 4G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
free -h   # vérifier que le swap est actif

# ☁️  — Mise à jour
sudo apt-get update && sudo apt-get -y upgrade

# ☁️  — Pare-feu OS : autoriser 80/443 (l'image Oracle Ubuntu a une règle REJECT)
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 80 -j ACCEPT
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 443 -j ACCEPT
sudo netfilter-persistent save   # rend les règles persistantes au reboot
```

---

## Étape 5 — Installer Docker + plugin compose

```bash
# ☁️
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker ubuntu        # utiliser docker sans sudo
exit                                  # se déconnecter…
```
```bash
# 🖥️  — …puis se reconnecter pour que le groupe 'docker' prenne effet
ssh -i ~/.ssh/ekolova.key ubuntu@130.162.241.147
```
```bash
# ☁️  — Vérifier
docker --version && docker compose version
```

---

## Étape 6 — Cloner le dépôt

```bash
# ☁️
cd ~
git clone https://github.com/<utilisateur>/<repo>.git ekolova
cd ~/ekolova
```

> Le dépôt contient déjà `Dockerfile`, `docker-compose.yml` et `Caddyfile` à la racine.

---

## Étape 7 — Créer les fichiers de configuration (`.env`)

Ces fichiers sont **gitignorés** : ils vivent uniquement sur la VM et **survivent aux `git pull`**.

### 7a. `.env` à la racine (lu par Caddy **et** par Mongo)

Ce fichier porte le domaine (Caddy) **et** les identifiants MongoDB. Commencer **en HTTP simple** (`SITE_ADDRESS=:80`), on passera en HTTPS à l'étape 9. Les mots de passe Mongo sont générés aléatoirement : sur un **volume vierge** (premier démarrage), `MONGO_INITDB_ROOT_*` crée le compte root et `mongo-init.js` crée le compte applicatif limité — **aucune création manuelle**.

```bash
# ☁️
MROOT=$(openssl rand -hex 16)
MAPP=$(openssl rand -hex 16)
cat > ~/ekolova/.env <<EOF
SITE_ADDRESS=:80

# --- MongoDB (authentification activée) ---
MONGO_HOST=mongo
MONGO_PORT=27017
MONGO_DB=gestion-ecole
MONGO_AUTH_SOURCE=admin
MONGO_ROOT_USER=ekolova_root
MONGO_ROOT_PASSWORD=$MROOT
MONGO_USER=ekolova_app
MONGO_PASSWORD=$MAPP
EOF
chmod 600 ~/ekolova/.env
```

> ⚠️ Si tu installes sur un **volume Mongo déjà existant** (sans ces variables au 1ᵉʳ démarrage), les comptes ne sont pas créés automatiquement : il faut les créer à la main (`docker compose exec mongo mongosh admin` → `db.createUser(...)`) **avant** d'activer `--auth`. Sur une install neuve, ignore cette note.

### 7b. `server/.env` (configuration de l'app)

Générer un **secret JWT** aléatoire et écrire le fichier :
```bash
# ☁️
JWT=$(openssl rand -hex 32)
cat > ~/ekolova/server/.env <<EOF
NODE_ENV=production
JWT_SECRET=$JWT
CORS_ORIGIN=http://130.162.241.147
APP_URL=http://130.162.241.147
SEED_DEMO=true          # true = peupler des données de démo au 1er démarrage ; false = base vide

# SMTP (envoi des identifiants par email) — optionnel
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=ton.email@gmail.com
SMTP_PASS=mot_de_passe_application_google_16_car
SMTP_FROM="Ekolova <ton.email@gmail.com>"
EOF
```

> - `JWT_SECRET` est **obligatoire** en prod et doit faire **≥ 32 caractères** : sinon l'app **refuse de démarrer**.
> - `PORT`, `NODE_ENV` et `MONGO_URI` sont imposés par `docker-compose.yml` — `MONGO_URI` est **assemblé à identifiants** depuis les variables `MONGO_*` du `.env` racine (étape 7a), pas besoin de le remettre ici.
> - `SMTP_PASS` Gmail = un **« mot de passe d'application »** (16 caractères), pas le mot de passe du compte.

---

## Étape 8 — Premier démarrage (HTTP) et vérification

```bash
# ☁️
cd ~/ekolova
docker compose up -d --build      # ⏳ 8–12 min au premier build (1 Go de RAM)
docker compose ps                 # les 3 conteneurs doivent être 'Up'
docker compose logs app --tail=30 # attendre « GestionÉcole API running »
```

Test (depuis la VM ou ta machine) :
```bash
curl -I http://130.162.241.147/                      # → HTTP 200 (frontend)
curl -X POST http://130.162.241.147/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"username":"admin","password":"admin123"}'    # → 201 + token
```

> **Compte admin par défaut** créé au 1er démarrage : `admin` / `admin123` → **à changer** après la première connexion.

---

## Étape 9 — Domaine DuckDNS + HTTPS (Let's Encrypt automatique)

### 9a. Créer le sous-domaine DuckDNS (gratuit)

1. Aller sur **https://www.duckdns.org**, se connecter (Google/GitHub).
2. Choisir un sous-domaine (ex. `ekolova`) → il devient `ekolova.duckdns.org`.
3. Dans le champ **current ip**, mettre l'IP publique de la VM (`130.162.241.147`) et **update**.
4. Noter le **token** affiché en haut (sert à mettre à jour l'IP par API ; **ne pas le committer**).

```bash
# 🖥️ ou ☁️  — forcer/mettre à jour le record A (à refaire si l'IP de la VM change)
curl "https://www.duckdns.org/update?domains=ekolova&token=<TON_TOKEN>&ip=130.162.241.147"
# → réponse "OK"
```

> Vérifier la résolution avant de continuer : `dig +short ekolova.duckdns.org` doit renvoyer `130.162.241.147`.

### 9b. Basculer Caddy + l'app sur le domaine (HTTPS)

```bash
# ☁️  — Passer SITE_ADDRESS au domaine (sed pour ne PAS écraser les variables MONGO_*)
sed -i 's#^SITE_ADDRESS=.*#SITE_ADDRESS=ekolova.duckdns.org#' ~/ekolova/.env

# Passer aussi l'app en https
sed -i 's#^CORS_ORIGIN=.*#CORS_ORIGIN=https://ekolova.duckdns.org#' ~/ekolova/server/.env
sed -i 's#^APP_URL=.*#APP_URL=https://ekolova.duckdns.org#'         ~/ekolova/server/.env

# Recréer les conteneurs avec la nouvelle config
docker compose up -d

# Suivre l'obtention du certificat (attendre « certificate obtained successfully »)
docker compose logs caddy --tail=30 | grep -i certificate
```

Vérification (depuis ta machine) :
```bash
# 🖥️
curl -I https://ekolova.duckdns.org/            # → HTTP 200
curl -I http://ekolova.duckdns.org/             # → 308 redirect vers https
```

> **Prérequis du certificat :** ports 80/443 ouverts (étapes 2 & 4) **et** le record A DuckDNS doit résoudre vers l'IP (étape 9a).

---

## Étape 10 — Déploiement continu (GitHub Actions)

Objectif : à chaque **merge sur `main`**, GitHub se connecte en SSH et redéploie.

### 10a. Le workflow

Le fichier [`.github/workflows/deploy.yml`](../.github/workflows/deploy.yml) est déjà dans le dépôt. Il fait, sur la VM :
```
git fetch origin main → git checkout -B main origin/main → docker compose up -d --build → docker image prune -f
```

### 10b. Créer les 3 secrets GitHub

```bash
# 🖥️  — depuis le dossier du dépôt local
gh secret set VM_HOST    --repo <utilisateur>/<repo> --body '130.162.241.147'
gh secret set VM_USER    --repo <utilisateur>/<repo> --body 'ubuntu'
gh secret set VM_SSH_KEY --repo <utilisateur>/<repo> < ~/.ssh/ekolova.key   # contenu de la clé PRIVÉE
```
Vérifier :
```bash
# 🖥️
gh secret list --repo <utilisateur>/<repo>     # doit lister VM_HOST, VM_USER, VM_SSH_KEY
```

### 10c. Activer

`deploy.yml` se déclenche **sur push vers `main`** : il devient actif dès qu'il est présent sur `main`. Il est aussi déclenchable **à la main** : onglet **Actions → Deploy — Oracle Cloud → Run workflow**.

> ⚠️ La clé `VM_SSH_KEY` doit être la **clé privée** correspondant à la clé publique installée sur la VM (celle de l'étape 1). Si tu utilises une clé dédiée au déploiement, ajoute d'abord sa partie **publique** dans `~/.ssh/authorized_keys` sur la VM.

---

## Étape 11 — Vérification finale

- ✅ https://ekolova.duckdns.org → l'app s'ouvre en HTTPS (cadenas valide).
- ✅ Connexion `admin` / `admin123` fonctionne (**à changer immédiatement** ; en prod ce mot de passe par défaut a été réinitialisé).
- ✅ Un push sur `main` lance le workflow **Deploy** (onglet Actions) qui se termine en vert.
- ✅ `docker compose ps` sur la VM → 3 conteneurs `Up`.
- ✅ Mongo exige bien l'auth : `docker compose exec mongo mongosh --quiet --eval 'db.adminCommand({listDatabases:1})'` (sans identifiants) → **`Unauthorized`**.

---

## Étape 12 — Dépannage (troubleshooting)

| Symptôme | Cause probable | Solution |
|---|---|---|
| `curl` depuis l'extérieur **timeout** | Port non ouvert | Vérifier **VCN Security List** (étape 2) **ET** `iptables` (étape 4) |
| **HTTP 502** quelques secondes après un deploy | `app` redémarre (normal) | Attendre ~30 s ; sinon `docker compose logs app` |
| **HTTP 502** persistant | l'app crashe | `docker compose logs app` ; souvent `JWT_SECRET` manquant/< 32 car. ou erreur Mongo |
| App `MongoServerError: Authentication failed` | identifiants Mongo absents/erronés, ou users pas créés sur le volume | Vérifier les `MONGO_*` du `.env` racine ; sur volume existant, créer les users à la main (cf. note étape 7a) |
| App crashe `Cannot find module './…'` | `tsconfig.tsbuildinfo` committé → `dist/` partiel | Ne jamais committer ce fichier ; le `Dockerfile` fait déjà `rm -f` avant `tsc` |
| Caddy n'obtient **pas** le certificat | 80/443 fermés, ou domaine ne résout pas | Rouvrir les ports ; vérifier `docker compose logs caddy` |
| Build **tué (OOM)** / très lent | Manque de RAM | Vérifier le **swap** (étape 4 : `free -h`) |
| `docker: permission denied` | Groupe docker pas pris en compte | Se reconnecter en SSH (étape 5) |
| Le workflow Deploy échoue à l'`ssh` | Mauvais `VM_SSH_KEY` | Re-coller la **clé privée** entière (`gh secret set VM_SSH_KEY < clé`) |

### Commandes utiles
```bash
# ☁️  (dans ~/ekolova)
docker compose ps                       # état
docker compose logs app -f --tail=50    # logs live
docker compose restart app              # redémarrer sans rebuild
docker compose up -d --build            # redéployer manuellement
# accès base (auth activée — identifiants depuis le .env racine)
source ~/ekolova/.env && docker compose exec mongo mongosh \
  -u "$MONGO_ROOT_USER" -p "$MONGO_ROOT_PASSWORD" --authenticationDatabase admin gestion-ecole
```

---

*Voir [`architecture.md`](./architecture.md) pour le détail des composants, des flux et de la sécurité.*
*Dernière mise à jour : 2026-06-12.*
