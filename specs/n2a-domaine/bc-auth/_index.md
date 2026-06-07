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
| Modules NestJS | `AuthModule` + `UsersModule` |
| Collection MongoDB | `users` |
| Canal Socket.IO | Aucun événement émis, mais **la connexion WebSocket est authentifiée** par jeton (voir Sécurité) |

---

## Rôle

Protéger l'accès à l'application par authentification JWT et gérer les comptes utilisateurs et leurs rôles. Toutes les routes de l'API sont protégées par défaut ; seules les routes explicitement marquées publiques (ex. la connexion) sont ouvertes.

---

## Responsabilités

1. Authentifier un utilisateur (identifiant + mot de passe) et émettre un jeton JWT
2. Exposer l'utilisateur courant à partir du jeton
3. Permettre à un utilisateur de changer son propre mot de passe
4. Gérer les comptes (création, modification, désactivation, suppression, réinitialisation de mot de passe) — réservé aux administrateurs
5. Garantir la présence d'au moins un administrateur actif
6. Créer un compte administrateur par défaut au premier démarrage

---

## Agrégat principal — User

| Champ | Type | Contrainte |
|-------|------|-----------|
| `username` | string | requis, **unique**, normalisé en minuscules |
| `passwordHash` | string | requis, **jamais exposé** (supprimé du JSON) |
| `nom` | string | défaut `''` |
| `role` | `'admin'` \| `'professeur'` \| `'secretaire'` | requis, défaut `'secretaire'` |
| `actif` | boolean | défaut `true` |

**Hachage du mot de passe :** `scrypt` (intégré à Node, sans dépendance), format stocké `<salt_hex>:<hash_hex>`, vérification à temps constant.

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
- **RG-AUT-02** — Le mot de passe fait au minimum 4 caractères. Il n'est jamais stocké ni renvoyé en clair.
- **RG-AUT-03** — Un compte désactivé (`actif = false`) ne peut pas se connecter ; le message d'erreur de connexion est volontairement générique (« Identifiants invalides ») pour ne pas révéler l'existence d'un compte.
- **RG-AUT-04** — Il doit toujours rester **au moins un administrateur actif** : impossible de supprimer, désactiver ou changer le rôle du dernier admin.
- **RG-AUT-05** — Le jeton JWT expire après **12 heures**.
- **RG-AUT-06** — Au premier démarrage, si aucun utilisateur n'existe, un compte admin par défaut est créé (`admin` / `admin123`, surchargeable via `ADMIN_USERNAME` / `ADMIN_PASSWORD`). À changer après la première connexion.

---

## Use Cases

| Ref. | Nom | Endpoint | Accès |
|------|-----|---------|-------|
| UC-AUT-001 | Se connecter | `POST /auth/login` | Public |
| UC-AUT-002 | Récupérer l'utilisateur courant | `GET /auth/me` | Authentifié |
| UC-AUT-003 | Changer son mot de passe | `POST /auth/change-password` | Authentifié |
| UC-AUT-004 | Lister les comptes | `GET /users` | admin |
| UC-AUT-005 | Créer un compte | `POST /users` | admin |
| UC-AUT-006 | Modifier un compte (nom, rôle, statut) | `PATCH /users/:id` | admin |
| UC-AUT-007 | Réinitialiser le mot de passe d'un compte | `PATCH /users/:id/password` | admin |
| UC-AUT-008 | Supprimer un compte | `DELETE /users/:id` | admin |

---

## Contrat API

### POST /auth/login  *(public)*
**Corps** : `{ username, password }`
**Réponse** : `{ access_token, user }` — `user` = `{ id, username, nom, role, actif }`
**Erreurs** : `401` si identifiant/mot de passe manquant, compte inexistant, inactif ou mot de passe invalide.

### GET /auth/me  *(authentifié)*
**Réponse** : l'utilisateur courant `{ id, username, nom, role, actif }`
**Erreurs** : `401` si jeton absent/invalide/expiré.

### POST /auth/change-password  *(authentifié)*
**Corps** : `{ current, next }`
**Réponse** : `{ ok: true }`
**Erreurs** : `400` si champ manquant ou mot de passe actuel incorrect.

### GET /users  *(admin)*
**Réponse** : tableau des comptes triés par date de création (sans `passwordHash`).

### POST /users  *(admin)*
**Corps** : `{ username, password, nom?, role? }`
**Réponse** : compte créé.
**Erreurs** : `400` (identifiant/mot de passe manquant, mot de passe < 4 car., rôle invalide), `409` (identifiant déjà pris).

### PATCH /users/:id  *(admin)*
**Corps** : `{ nom?, role?, actif? }`
**Réponse** : compte mis à jour.
**Erreurs** : `400` (rôle invalide, ou tentative de retirer le dernier admin actif), `404` (introuvable).

### PATCH /users/:id/password  *(admin)*
**Corps** : `{ password }`
**Réponse** : compte mis à jour.
**Erreurs** : `400` (mot de passe < 4 car.), `404` (introuvable).

### DELETE /users/:id  *(admin)*
**Réponse** : `{ ok: true }`
**Erreurs** : `400` (suppression du dernier admin actif), `404` (introuvable).

---

## Sécurité (rappel — détails techniques en N3)

- Authentification **JWT** (HS256, implémentation maison sans dépendance), jeton transmis via l'en-tête `Authorization: Bearer <token>`.
- Deux **gardes globales** (`APP_GUARD`) : `JwtAuthGuard` (vérifie le jeton) puis `RolesGuard` (vérifie le rôle).
- Décorateurs : `@Public()` (ouvre une route), `@Roles(...)` (restreint par rôle), `@CurrentUser()` (injecte l'utilisateur courant).
- **WebSocket** : la gateway Socket.IO authentifie chaque connexion via le jeton du handshake et déconnecte les clients non authentifiés.
- Voir [n3-comment/backend/architecture/backend.md](../../n3-comment/backend/architecture/backend.md) §Sécurité.
