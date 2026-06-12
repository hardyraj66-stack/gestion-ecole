<a id="BC-AUT"></a>
# BC-AUT — Bounded Context : Authentification & Comptes

> **Couche** : N2a — QUOI (métier)
> **Ce fichier contient** : identité du BC, rôle, agrégat, use cases, contrat API, sécurité
> **Ce fichier NE contient PAS** : détails d'écrans (→ N2b), détails techniques (→ N3)

---

## Identité

| Attribut | Valeur |
|----------|--------|
| Identifiant | BC-AUT |
| Nom | Authentification & Comptes |
| Modules NestJS | `AuthModule` + `UsersModule` + `AuditModule` |
| Collections MongoDB | `users`, `audit_logs` (journal d'actions sur les comptes) |
| Canal Socket.IO | **Présence** : émet `presence:changed` à la connexion/déconnexion d'un compte (qui est en ligne). **La connexion WebSocket est authentifiée** par jeton et revérifiée en base (voir Sécurité). |

---

## Rôle

Protéger l'accès à l'application par authentification JWT et gérer les comptes utilisateurs et leurs rôles. Toutes les routes de l'API sont protégées par défaut ; seules les routes explicitement marquées publiques (ex. la connexion) sont ouvertes.

---

## Responsabilités

1. Authentifier un utilisateur (identifiant + mot de passe) et émettre un jeton JWT
2. Exposer et laisser modifier l'utilisateur courant (profil : nom, email) à partir du jeton
3. Permettre à un utilisateur de changer son propre mot de passe et de réinitialiser un mot de passe oublié (self-service)
4. Gérer les **sessions par appareil** (lister, révoquer une session, déconnecter toutes les sessions)
5. Gérer les comptes (création + envoi des identifiants par email, modification, désactivation, archivage/restauration, réinitialisation de mot de passe) — réservé aux administrateurs
6. Garantir la présence d'au moins un administrateur actif
7. Créer un compte administrateur par défaut au premier démarrage
8. Tracer les actions sensibles sur les comptes (journal d'audit `audit_logs`)
9. Diffuser la **présence** (qui est connecté) via WebSocket

---

## Agrégat principal — User

| Champ | Type | Contrainte |
|-------|------|-----------|
| `username` | string | requis, **unique**, normalisé en minuscules |
| `passwordHash` | string | requis, **jamais exposé** (supprimé du JSON) |
| `nom` | string | défaut `''` |
| `email` | string | défaut `''` — sert à l'envoi des identifiants et au « mot de passe oublié » ; **unique** parmi tous les comptes quand renseigné |
| `role` | `'admin'` \| `'professeur'` \| `'secretaire'` | requis, défaut `'secretaire'` |
| `actif` | boolean | défaut `true` |
| `professeur_id` | string \| null | défaut `null` — lien vers la fiche Professeur si `role='professeur'` |
| `mustChangePassword` | boolean | défaut `false` — force la définition d'un mot de passe à la prochaine connexion |
| `deleted` | boolean | défaut `false` — **soft-delete** (archivage, jamais réellement effacé) |
| `tokenVersion` | number | défaut `0` — incrémentée pour **invalider toutes les sessions** existantes |
| `lastLoginAt` | Date \| null | défaut `null` — dernière connexion réussie |
| `resetTokenHash` | string | défaut `''`, **jamais exposé** — SHA-256 du jeton « mot de passe oublié » |
| `resetTokenExpires` | number | défaut `0` — expiration (timestamp ms) du jeton de réinitialisation |
| `sessions` | tableau | une entrée par appareil `{ jti, userAgent, ip, createdAt }`, **jamais exposé** dans le JSON (endpoint dédié) |

**Hachage du mot de passe :** `scrypt` (intégré à Node, sans dépendance), format stocké `<salt_hex>:<hash_hex>`, vérification à temps constant.

**Champs masqués dans le JSON (`toJSON`) :** `passwordHash`, `resetTokenHash`, `resetTokenExpires`, `sessions`.

**Index MongoDB :**
- `{ username: 1 }` unique

---

## Rôles

| Rôle | Description | Accès |
|------|-------------|-------|
| `admin` | Administrateur | Accès complet, dont la gestion des comptes (`/users`, page `/utilisateurs`) |
| `secretaire` | Secrétariat | Saisie et consultation courante (élèves, notes, planning…) |
| `professeur` | Professeur | Accès restreint (consultation) |

---

## Règles métier

- **RG-AUT-01** — L'identifiant est unique et insensible à la casse (stocké en minuscules).
- **RG-AUT-02** — **Politique de mot de passe** : minimum **8 caractères**, avec au moins **une lettre et un chiffre**. Il n'est jamais stocké ni renvoyé en clair. (Appliquée à la création, au changement, à la réinitialisation et au « mot de passe oublié ».)
- **RG-AUT-03** — Un compte désactivé (`actif = false`) ou archivé (`deleted = true`) ne peut pas se connecter ; le message d'erreur de connexion est volontairement générique (« Identifiants invalides ») pour ne pas révéler l'existence d'un compte.
- **RG-AUT-04** — Il doit toujours rester **au moins un administrateur actif** : impossible de supprimer (archiver), désactiver ou changer le rôle du dernier admin.
- **RG-AUT-05** — Le jeton JWT expire après **12 heures** ; il porte la `tokenVersion` (`tv`) et l'identifiant de session (`jti`).
- **RG-AUT-06** — Au premier démarrage, si aucun utilisateur n'existe, un compte admin par défaut est créé (`admin` / `admin123`, surchargeable via `ADMIN_USERNAME` / `ADMIN_PASSWORD`). À changer après la première connexion. *(En production, ce mot de passe par défaut a été réinitialisé en mot de passe fort + `mustChangePassword=true`.)*
- **RG-AUT-07** — **Suppression = archivage (soft-delete)** : un compte supprimé est marqué `deleted=true, actif=false` et ses sessions sont révoquées ; il reste restaurable et **réserve** son identifiant/email (restauration plutôt que recréation).
- **RG-AUT-08** — **Révocation de session immédiate** : toute désactivation, archivage, changement de mot de passe ou « déconnexion de toutes les sessions » incrémente `tokenVersion` ; les jetons émis avant deviennent invalides au prochain appel (le garde revérifie le compte en base).
- **RG-AUT-09** — **Anti brute-force** : 5 échecs de connexion sur un même identifiant → blocage temporaire **15 minutes** (message générique) ; compteur remis à zéro au succès. Les routes `login` / `forgot-password` / `reset-password` sont en outre limitées par IP.
- **RG-AUT-10** — **Mot de passe oublié** : la réponse de `forgot-password` est **toujours neutre** (`{ ok: true }`) pour ne pas révéler l'existence d'un compte ; le jeton de réinitialisation est à usage unique et expire après **1 heure**.
- **RG-AUT-11** — **Unicité de l'email** : un email renseigné doit être unique parmi tous les comptes (vérifié à la création et à l'édition, hors le compte courant).

---

## Use Cases

| Ref. | Nom | Endpoint | Accès |
|------|-----|---------|-------|
| UC-AUT-001 | Se connecter | `POST /auth/login` | Public |
| UC-AUT-002 | Récupérer l'utilisateur courant | `GET /auth/me` | Authentifié |
| UC-AUT-003 | Modifier son profil (nom, email) | `PATCH /auth/me` | Authentifié |
| UC-AUT-004 | Changer son mot de passe | `POST /auth/change-password` | Authentifié |
| UC-AUT-005 | Se déconnecter (session courante) | `POST /auth/logout` | Authentifié |
| UC-AUT-006 | Déconnecter toutes les sessions | `POST /auth/logout-all` | Authentifié |
| UC-AUT-007 | Lister ses sessions actives | `GET /auth/sessions` | Authentifié |
| UC-AUT-008 | Révoquer une session précise | `DELETE /auth/sessions/:jti` | Authentifié |
| UC-AUT-009 | Demander une réinitialisation de mot de passe | `POST /auth/forgot-password` | Public |
| UC-AUT-010 | Réinitialiser le mot de passe via jeton | `POST /auth/reset-password` | Public |
| UC-AUT-011 | Lister les comptes | `GET /users` | admin |
| UC-AUT-012 | Lister les comptes archivés | `GET /users/archives` | admin |
| UC-AUT-013 | Créer un compte (+ envoi des identifiants) | `POST /users` | admin |
| UC-AUT-014 | Modifier un compte (nom, email, rôle, statut) | `PATCH /users/:id` | admin |
| UC-AUT-015 | Réinitialiser le mot de passe d'un compte | `PATCH /users/:id/password` | admin |
| UC-AUT-016 | Restaurer un compte archivé | `PATCH /users/:id/restaurer` | admin |
| UC-AUT-017 | Supprimer (archiver) un compte | `DELETE /users/:id` | admin |

---

## Contrat API

### POST /auth/login  *(public)*
**Corps** : `{ username, password }`
**Réponse** : `{ access_token, user, mustChangePassword? }` — `user` = `{ id, username, nom, email, role, actif, … }`. Une session est enregistrée (jti, userAgent, ip) et `lastLoginAt` mis à jour.
**Erreurs** : `401` si identifiant/mot de passe manquant, compte inexistant, inactif/archivé ou mot de passe invalide ; `429`/blocage temporaire après 5 échecs sur le même identifiant.

### GET /auth/me  *(authentifié)*
**Réponse** : l'utilisateur courant (sans `passwordHash`/`sessions`).
**Erreurs** : `401` si jeton absent/invalide/expiré/révoqué.

### PATCH /auth/me  *(authentifié)*
**Corps** : `{ nom?, email? }` — l'email est validé (format) et son unicité vérifiée hors compte courant.
**Réponse** : l'utilisateur à jour.
**Erreurs** : `400` (email invalide), `409` (email déjà pris).

### POST /auth/change-password  *(authentifié)*
**Corps** : `{ current, next }` — `next` soumis à la politique de mot de passe (RG-AUT-02).
**Réponse** : `{ ok: true }` — incrémente `tokenVersion` (révoque les autres sessions, conserve la session courante).
**Erreurs** : `400` si champ manquant, mot de passe actuel incorrect ou `next` non conforme.

### POST /auth/logout  *(authentifié)* · POST /auth/logout-all  *(authentifié)*
`logout` supprime la session courante (`jti`) ; `logout-all` incrémente `tokenVersion` et invalide **toutes** les sessions.

### GET /auth/sessions  *(authentifié)* · DELETE /auth/sessions/:jti  *(authentifié)*
Liste les sessions actives (marque la session courante) ; révoque une session précise par son `jti`.

### POST /auth/forgot-password  *(public)*
**Corps** : `{ email }`
**Réponse** : **toujours** `{ ok: true }` (réponse neutre, RG-AUT-10). Si un compte actif correspond : stocke `sha256(token)` + expiration 1 h et envoie un lien par email.

### POST /auth/reset-password  *(public)*
**Corps** : `{ token, password }` — jeton à usage unique non expiré ; `password` soumis à la politique (RG-AUT-02).
**Réponse** : `{ ok: true }` — efface le jeton, met `mustChangePassword=false`, incrémente `tokenVersion`.
**Erreurs** : `400` (jeton invalide/expiré ou mot de passe non conforme).

### GET /users  *(admin)* · GET /users/archives  *(admin)*
`/users` : comptes **actifs/non archivés** triés par date de création (sans `passwordHash`). `/users/archives` : comptes archivés (`deleted=true`).

### POST /users  *(admin)*
**Corps** : `{ username, password?, nom?, email?, role? }` — si `password` est omis, un mot de passe fort est **généré** ; si un `email` est fourni, les identifiants sont **envoyés par email** et `mustChangePassword=true`.
**Réponse** : `{ …compte, account: { username, emailSent, password? } }` (le mot de passe n'est renvoyé que si l'email n'a pas pu partir).
**Erreurs** : `400` (identifiant manquant, mot de passe non conforme, rôle invalide), `409` (identifiant ou email déjà pris).

### PATCH /users/:id  *(admin)*
**Corps** : `{ nom?, email?, role?, actif? }` — l'identifiant n'est pas modifiable ; passer un rôle `professeur`→autre détache `professeur_id`.
**Réponse** : compte mis à jour.
**Erreurs** : `400` (rôle invalide, ou tentative de retirer le dernier admin actif), `409` (email déjà pris), `404` (introuvable).

### PATCH /users/:id/password  *(admin)*
**Corps** : `{ password? }` — généré si omis ; force `mustChangePassword=true` et envoie l'email si le compte a un email.
**Réponse** : `{ account: { username, emailSent, password? } }`.
**Erreurs** : `400` (mot de passe non conforme), `404` (introuvable).

### PATCH /users/:id/restaurer  *(admin)*
Restaure un compte archivé (`deleted=false`). **Réponse** : compte restauré.

### DELETE /users/:id  *(admin)*
**Soft-delete** : marque `deleted=true, actif=false`, révoque les sessions. **Réponse** : `{ ok: true }`.
**Erreurs** : `400` (suppression du dernier admin actif), `404` (introuvable).

---

## Sécurité (rappel — détails techniques en N3)

- Authentification **JWT** (HS256, implémentation maison sans dépendance, immunisée `alg:none`, comparaison à temps constant), jeton transmis via l'en-tête `Authorization: Bearer <token>`. Le secret `JWT_SECRET` est **obligatoire en production** (refus de démarrer si absent ou < 32 caractères).
- Deux **gardes globales** (`APP_GUARD`) : `JwtAuthGuard` puis `RolesGuard`. Le `JwtAuthGuard` est **stateful** : après vérification de signature, il recharge le compte en base et rejette (401) si `actif=false`, `deleted=true` ou si la `tokenVersion` du jeton ne correspond plus (→ révocation immédiate, RG-AUT-08).
- Décorateurs : `@Public()` (ouvre une route), `@Roles(...)` (restreint par rôle), `@CurrentUser()` (injecte l'utilisateur courant).
- **Anti-injection NoSQL** : middleware global qui retire les clés `$`/`.` de `body`/`query`/`params`.
- **Anti brute-force** : compteur en mémoire par identifiant (5 échecs → 15 min) + limiteur par IP **ciblé** sur `login`/`forgot-password`/`reset-password` (école = IP partagée, donc pas de limite globale).
- **Sessions par appareil** (`jti`) révocables individuellement ou en masse (`tokenVersion`).
- **WebSocket** : la gateway Socket.IO authentifie chaque connexion via le jeton du handshake, **revérifie le compte en base** (actif/non archivé) et déconnecte les clients non authentifiés. Elle diffuse la présence (`presence:changed`).
- **Journal d'audit** (`audit_logs`) : création/modification/suppression/restauration/réinitialisation/changement de rôle des comptes.
- Voir [n3-comment/backend/architecture/backend.md](../../n3-comment/backend/architecture/backend.md) §Sécurité.
