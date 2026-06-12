# Architecture Backend

> **Couche** : N3 — COMMENT (backend)
> **Ce fichier contient** : stack technique, structure NestJS, patterns, middleware, WebSocket
> **Ce fichier NE contient PAS** : détails métier (→ N2a), détails écrans (→ N2b)

---

## Stack technique

| Technologie | Version | Rôle |
|-------------|---------|------|
| NestJS | — | Framework Node.js (modules, DI, décorateurs) |
| TypeScript | 5 | Typage statique |
| MongoDB | — | Base de données document |
| Mongoose | — | ODM MongoDB |
| @nestjs/mongoose | — | Intégration Mongoose dans NestJS |
| Socket.IO | — | WebSocket temps réel |
| @nestjs/platform-socket.io | — | Gateway WebSocket NestJS |

---

## Configuration

| Variable d'env | Défaut | Rôle |
|----------------|--------|------|
| `MONGO_URI` | `mongodb://localhost:27017/gestion-ecole` | URI de connexion MongoDB. En production, l'URI **inclut les identifiants** (`mongodb://<user>:<pass>@mongo:27017/gestion-ecole?authSource=admin`) car MongoDB tourne avec `--auth` (voir §Sécurité). |
| `PORT` | `3000` | Port du serveur HTTP |
| `JWT_SECRET` | `dev-secret-change-me-gestion-ecole` (dev only) | Secret de signature des jetons JWT. **Obligatoire en production** : refus de démarrer si absent ou **< 32 caractères**. |
| `CORS_ORIGIN` | `*` | Origines autorisées (CORS HTTP + Socket.IO), séparées par des virgules. À restreindre en production (ex. `https://ekolova.duckdns.org`). |
| `APP_URL` | origine du frontend (dev) | Base des liens envoyés par email (ex. lien « mot de passe oublié »). |
| `SEED_DEMO` | `true` | Si `false`, désactive le seeder de démo (production). |
| `ADMIN_USERNAME` | `admin` | Identifiant du compte admin créé au premier démarrage |
| `ADMIN_PASSWORD` | `admin123` | Mot de passe du compte admin par défaut (à changer ; réinitialisé en prod) |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` / `SMTP_FROM` | — | Envoi des identifiants et des liens de réinitialisation (Gmail en production). |

> **Déploiement (docker-compose) :** l'URI Mongo de production est **assemblée** depuis des variables séparées du `.env` racine : `MONGO_HOST`, `MONGO_PORT`, `MONGO_DB`, `MONGO_AUTH_SOURCE`, `MONGO_USER`, `MONGO_PASSWORD` (compte applicatif à privilèges limités) et `MONGO_ROOT_USER`/`MONGO_ROOT_PASSWORD` (compte root, maintenance/init). Voir `devops/` et `.env.example`.

---

## Structure des modules

```
server/src/
├── app.module.ts              # Module racine — importe tous les modules, configure MongoDB
├── main.ts                    # Bootstrap NestJS + Socket.IO CORS
├── auth/                      # Module Authentification (JWT, gardes globales, décorateurs)
│   ├── auth.controller.ts     # login, me, profil, change/forgot/reset-password, sessions, logout(-all)
│   ├── auth.service.ts        # login (anti brute-force, lastLoginAt), sessions, reset, révocation
│   ├── auth.module.ts         # enregistre JwtAuthGuard + RolesGuard en APP_GUARD
│   ├── jwt.util.ts            # signature/vérification JWT HS256 (sans dépendance)
│   ├── password.util.ts       # hachage scrypt (salt:hash) + validatePasswordStrength (≥8, lettre+chiffre)
│   ├── jwt-auth.guard.ts · roles.guard.ts   # guard stateful : recharge le compte (actif/deleted/tokenVersion)
│   └── public.decorator.ts · roles.decorator.ts · current-user.decorator.ts
├── users/                     # Module Comptes utilisateurs (CRUD, admin-only)
│   ├── user.schema.ts         # + email, professeur_id, mustChangePassword, deleted, tokenVersion, sessions…
│   ├── users.controller.ts    # CRUD + /archives + /restaurer + reset password (email)
│   ├── users.service.ts       # admin par défaut au 1er démarrage, règle « dernier admin », soft-delete
│   └── users.module.ts
├── audit/                     # Journal d'actions sur les comptes (collection audit_logs)
├── mail/                      # Envoi d'emails (identifiants, lien de réinitialisation)
├── classes/                   # Module Classes
│   ├── classe.schema.ts
│   ├── classes.controller.ts
│   ├── classes.service.ts
│   └── classes.module.ts
├── eleves/                    # Module Élèves
├── matieres/                  # Module Matières
├── notes/                     # Module Notes
├── planning/                  # Module Planning (créneaux)
├── salles/                    # Module Salles
├── annees/                    # Module Années scolaires
├── niveaux/                   # Module Niveaux
├── professeurs/               # Module Professeurs
├── teacher-assignments/       # Module Affectations enseignant
├── periodes/                  # Module Périodes d'évaluation
├── evaluations/               # Module Évaluations
├── suivi/                     # Module Suivi (absences, avertissements, convocations)
├── exclusions/                # Module Exclusions
├── departs/                   # Module Départs
├── planning-executions/       # Module Exécutions de planning (séances réalisées)
├── read/                      # Module Read — endpoints /read/*
│   ├── read.controller.ts
│   ├── read.service.ts
│   ├── view-builder.service.ts
│   └── schemas/               # Schémas des vues dénormalisées (ReadClasse, ReadEleve…)
├── events/
│   └── events.gateway.ts      # Gateway Socket.IO
├── data/
│   └── seeder.service.ts      # Seeder de données de démo
├── export/                    # Module Export (CSV/XLSX/PDF)
├── migration/                 # Module Migration
└── common/
    ├── mongo-sanitize.middleware.ts    # anti-injection NoSQL (strip clés $/.)
    ├── auth-rate-limit.middleware.ts   # limiteur par IP ciblé (login/forgot/reset)
    └── middleware/
        └── api-logger.middleware.ts
```

> À la **racine du dépôt** (hors `server/src`) : `docker-compose.yml` (3 services mongo/app/caddy), `mongo-init.js` (création du compte applicatif sur un volume Mongo vierge), `.env.example`. MongoDB tourne **standalone avec `--auth`** (pas de replica set → change streams en best-effort).

---

## Pattern de module domaine

Chaque module domaine suit la même structure :

```
<domaine>/
├── <domaine>.schema.ts       # @Schema Mongoose — définit la collection et les champs
├── <domaine>.controller.ts   # @Controller — endpoints REST, délègue au service
├── <domaine>.service.ts      # @Injectable — logique métier, accès MongoDB
└── <domaine>.module.ts       # @Module — importe les dépendances, exporte le service
```

**Pattern du contrôleur** :
1. Appel service (mutation)
2. Émission événement Socket.IO via `EventsGateway`
3. Mise à jour vue dénormalisée via `ViewBuilderService`
4. Retour du résultat

---

## Sécurité — Authentification & autorisation

**Stratégie : JWT + gardes globales.** L'API est protégée par défaut ; on ouvre explicitement les routes publiques.

### Jeton JWT
- Implémentation maison HS256 (`auth/jwt.util.ts`), sans dépendance externe, comparaison de signature à **temps constant** et immunisée contre `alg:none`. Payload : `{ sub, username, role, tv, jti, iat, exp }` — `tv` = `tokenVersion` (révocation), `jti` = identifiant de session (appareil). Expiration **12 h** (`JWT_EXPIRES_IN_SEC`).
- Transmis par le client via l'en-tête `Authorization: Bearer <token>`.
- `JWT_SECRET` **obligatoire en production** (`main.ts` refuse de démarrer si absent ou < 32 caractères) ; `app.set('trust proxy', …)` pour obtenir l'IP réelle derrière Caddy.

### Gardes globales (`APP_GUARD`)
Enregistrées dans `auth.module.ts`, appliquées à **toutes** les routes dans l'ordre :
1. `JwtAuthGuard` — vérifie la signature, puis (**stateful**) recharge le compte en base et **rejette (401)** si `actif=false`, `deleted=true` ou si `payload.tv !== user.tokenVersion`. → désactivation / archivage / changement de mot de passe / « logout-all » invalident immédiatement les jetons déjà émis. Laisse passer les routes `@Public()`.
2. `RolesGuard` — vérifie que le rôle de l'utilisateur figure parmi ceux exigés par `@Roles(...)`.

### Décorateurs
| Décorateur | Rôle |
|-----------|------|
| `@Public()` | Ouvre une route sans authentification (ex. `POST /auth/login`) |
| `@Roles('admin', …)` | Restreint l'accès aux rôles indiqués (ex. tout le contrôleur `/users` est `@Roles('admin')`) |
| `@CurrentUser()` | Injecte l'utilisateur courant (ou un de ses champs, ex. `@CurrentUser('id')`) dans le handler |

### Comptes
- Schéma `User` (collection `users`) : `username` (unique, minuscules), `passwordHash` (scrypt `salt:hash`, jamais exposé via `toJSON`), `nom`, `email` (unique si renseigné), `role` (`admin|professeur|secretaire`), `actif`, `professeur_id`, `mustChangePassword`, `deleted` (soft-delete), `tokenVersion`, `lastLoginAt`, `resetTokenHash`/`resetTokenExpires` (jamais exposés), `sessions[]` (par appareil, jamais exposé).
- **Politique de mot de passe** : `validatePasswordStrength` (≥ 8 caractères, au moins une lettre et un chiffre) appliquée à toute définition de mot de passe.
- Bootstrap : `UsersService.onModuleInit()` crée un admin par défaut (`ADMIN_USERNAME`/`ADMIN_PASSWORD`) si la collection est vide.
- Règle « dernier admin » : impossible de supprimer (archiver), désactiver ou rétrograder le dernier administrateur actif.
- **Soft-delete** : `remove()` marque `deleted=true, actif=false` et incrémente `tokenVersion` (au lieu d'effacer). Onglet « Archivés » + restauration.
- **Audit** : `AuditService.log(action, targetUserId, byUserId, meta)` journalise create/update/delete/restore/reset/role-change dans `audit_logs`.

### Anti brute-force & limitation de débit
- `AuthService` tient un compteur en mémoire `Map<username, { fails, lockedUntil }>` : **5 échecs → blocage 15 min**, remis à zéro au succès, message générique.
- `AuthRateLimitMiddleware` (`common/auth-rate-limit.middleware.ts`) limite par **IP** les routes sensibles `login`/`forgot-password`/`reset-password`. Ciblé (pas global) car une école partage souvent une IP.

### Anti-injection NoSQL
`MongoSanitizeMiddleware` (`common/mongo-sanitize.middleware.ts`) retire récursivement les clés commençant par `$` ou contenant `.` dans `body`/`query`/`params` avant tout traitement.

### Sessions & mot de passe oublié
- **Sessions par appareil** : chaque login ajoute `{ jti, userAgent, ip, createdAt }` dans `sessions[]`. `logout` retire la session courante, `logout-all` incrémente `tokenVersion`, `DELETE /auth/sessions/:jti` révoque une session précise.
- **Mot de passe oublié** : `forgot-password` répond **toujours** `{ ok: true }` (neutre) ; si un compte actif correspond, stocke `sha256(token)` + expiration 1 h et envoie un lien via `MailService`. `reset-password` valide le jeton (usage unique, non expiré), applique la politique, efface le jeton et incrémente `tokenVersion`.

### MongoDB — authentification (production)
MongoDB tourne avec `--auth`. Deux comptes dans la base `admin` : `ekolova_root` (rôle `root`, maintenance) et le compte applicatif (`readWrite`+`dbAdmin` sur la **seule** base `gestion-ecole`) utilisé par l'API via `authSource=admin`. Mongo n'est exposé que sur le réseau Docker interne (seul Caddy est public). Voir `devops/`.

### Connexion WebSocket
La gateway Socket.IO authentifie **chaque connexion** : `EventsGateway.handleConnection` lit le token dans le handshake (`client.handshake.auth.token`, repli sur `query.token`), le vérifie avec `verifyJwt(token, JWT_SECRET)`, **revérifie le compte en base** (actif / non archivé) et **déconnecte immédiatement** (`client.disconnect(true)`) toute connexion sans token, avec un token invalide/expiré ou un compte révoqué. Le temps réel n'est donc accessible qu'aux clients authentifiés. La gateway diffuse aussi la **présence** (`presence:changed`).

> Détails fonctionnels et contrat API complet : [bc-auth/_index.md](../../../n2a-domaine/bc-auth/_index.md).

---

## Module Read — Pattern CQRS côté lecture

### ReadController

Tous les endpoints `GET /read/*` sont dans `ReadController`. Ils retournent des vues dénormalisées pré-calculées optimisées pour chaque page frontend.

### ReadService

Interroge les collections `read-*` (vues matérialisées) ou construit la vue à la volée pour les endpoints qui en ont besoin.

### ViewBuilderService

Maintient les vues dénormalisées dans des collections `read-*` :
- **Collections** : `read-classes`, `read-eleves`, `read-matieres`, `read-notes`, `read-creneaux`, `read-salles`, `read-evaluations`
- **Déclencheurs** : `onClasseWrite`, `onEleveWrite`, `onNoteWrite`, `onCreneauWrite`, `onSalleWrite`, `onMatiereWrite`, `onEvaluationWrite`, `onProfesseurWrite`, `onNiveauWrite`
- **Stratégie** : upsert ciblé sur l'entité modifiée. Si l'ID n'est pas fourni (ex: fusion de créneaux), rebuild complet du sous-ensemble concerné.
- **Change Streams** : en mode Replica Set MongoDB, des Change Streams permettent de détecter automatiquement les changements sans appel explicite aux méthodes `on*Write`.
- **Fallback** : `rebuildAll()` au démarrage du module pour garantir la cohérence.

---

## WebSocket — EventsGateway

Fichier : `server/src/events/events.gateway.ts`

Gateway Socket.IO unique. Les services domaine appellent `events.emit(event, payload)` après chaque mutation.

**Mapping événements → canaux frontend** :

| Événement backend | Canal frontend (`notifyDataChange`) |
|------------------|-------------------------------------|
| `classe:*` | `classes` |
| `eleve:*` | `eleves` |
| `matiere:*` | `matieres` |
| `note:*` | `notes` |
| `creneau:*` | `planning` |
| `salle:*` | `salles` |
| `annee:*` | `annees` |
| `niveau:*` | `niveaux` |
| `professeur:*` | `professeurs` |
| `evaluation:*` | `evaluations` |
| `periode:*` | `periodes` |
| `presence:changed` | `presence` (qui est en ligne — voir BC-AUT) |

---

## Middleware

Appliqués globalement (dans l'ordre) :
- `MongoSanitizeMiddleware` — anti-injection NoSQL (retire les clés `$`/`.` de `body`/`query`/`params`).
- `AuthRateLimitMiddleware` — limiteur par IP ciblé sur `login`/`forgot-password`/`reset-password`.
- `ApiLoggerMiddleware` — logue méthode HTTP, URL, durée.

---

## Seeder

`SeederService` s'exécute automatiquement au démarrage si toutes les collections sont vides. Insère :
- 12 salles
- 15 classes
- 15 matières (avec coefficients par niveau)
- ~350 élèves
- ~2 000 notes
- ~200 créneaux

Réinitialisation manuelle : `cd server && npm run reset` (script `src/data/reset.cli.ts`).

---

## Serialisation JSON

Tous les schémas Mongoose utilisent un `toJSON` transform qui :
- Ajoute `id` (copie de `_id`)
- Supprime `_id` et `__v`
- Activé par `{ toJSON: { virtuals: true, transform: toJsonTransform } }`
