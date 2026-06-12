<a id="PAGE-AUT-002"></a>
# Utilisateurs

> **Couche** : N2b — QUOI écrans (page : Utilisateurs)
> **Acteur concerné** : [Administrateur](../../n1-acteurs/administrateur/_index.md)
> **UC sous-jacents** : [UC-AUT-011 à UC-AUT-017](../../n2a-domaine/bc-auth/_index.md)
> **Type de page** : Tableau (live + archives) + modales (création / édition / réinitialisation)
> **Route** : `/utilisateurs` — protégée par `RequireAuth roles={['admin']}`
> **Source de données** : appels directs `fetch` vers `/users` (pas de hook `usePageFetch`) ; **présence en temps réel** via Socket.IO (`presence:changed`)
> **Ce fichier contient** : colonnes, actions, comportements
> **Ce fichier NE contient PAS** : logique métier (→ N2a)

---

## Accès

Lien visible dans la barre latérale uniquement pour les `admin` (`hasRole('admin')`). Un non-admin qui tente la route est redirigé vers `/dashboard`.

---

## Colonnes

| Colonne | Source | Notes |
|---------|--------|-------|
| Nom | `user.nom` (ou `—`) | Marque « (vous) » sur la ligne du compte courant |
| Identifiant | `user.username` | — |
| Email | `user.email` (ou `—`) | Sert à l'envoi des identifiants / au « mot de passe oublié » |
| Rôle | `user.role` | `Select` éditable en ligne (admin / secrétaire / professeur) ; **désactivé sur soi-même** |
| Statut | `user.actif` | Badge « Actif » / « Inactif » |
| Présence | temps réel (`presence:changed`) | `PresenceDot` « En ligne » / « Hors ligne » ; infobulle = dernière connexion si hors ligne |
| Confirmation | `user.mustChangePassword` | Badge « En attente » (mot de passe généré pas encore changé) / « Confirmé » |
| Dernière connexion | `user.lastLoginAt` | Date/heure formatée (ou `—`) |
| Actions | — | Voir ci-dessous |

---

## Actions par ligne

| Action | Comportement | Restriction |
|--------|-------------|-------------|
| Modifier | Modale (nom + email) → `PATCH /users/:id { nom, email }` | — |
| Changer le rôle | `PATCH /users/:id { role }` (via le `Select`) | Désactivé sur soi-même |
| Réinitialiser le mot de passe | Modale (laisser vide = généré ; sinon ≥ 8 car.) → `PATCH /users/:id/password` ; si le compte a un email, les identifiants sont **renvoyés par email**, sinon le mot de passe est affiché à l'admin | — |
| Activer / Désactiver | `PATCH /users/:id { actif }` | Désactivé sur soi-même |
| Supprimer | Confirmation → `DELETE /users/:id` (**archivage / soft-delete**, restaurable) | Désactivé sur soi-même |

---

## Actions de page

| Action | Comportement |
|--------|-------------|
| + Nouveau compte | Ouvre une modale : email (requis), nom, rôle, identifiant. **Si rôle = professeur**, la modale demande nom + prénom + genre et crée la **fiche professeur** (qui crée le compte et envoie l'email) ; sinon `POST /users`. Le mot de passe est généré et envoyé par email (ou affiché si l'email échoue). |
| Voir / Masquer les archives | Bascule l'affichage des comptes archivés (`GET /users/archives`) avec une action **Restaurer** par ligne (`PATCH /users/:id/restaurer`) |

---

## Comportements & erreurs

| Situation | Comportement |
|-----------|-------------|
| Mot de passe < 8 caractères, ou sans lettre + chiffre (création ou reset) | Erreur de validation, action bloquée |
| Email manquant à la création | Message « L'email est requis » |
| Identifiant déjà pris | Message « Cet identifiant existe déjà » dans la modale |
| Email déjà pris par un professeur | Lien proposé vers la fiche du professeur existant |
| Dernier admin actif (désactivation, changement de rôle, suppression) | Message « il doit rester au moins un administrateur actif » (boîte de dialogue) |
| Échec de chargement de la liste | Message d'erreur en haut de page |

> **Profil personnel** — chaque utilisateur (tout rôle) dispose d'une page `/profil` (édition inline nom/email, changement de mot de passe, sessions par appareil et « déconnexion de toutes les sessions »). La réinitialisation en self-service passe par « Mot de passe oublié ? » sur l'écran de connexion (voir [bc-auth/_index.md](../../n2a-domaine/bc-auth/_index.md)).
