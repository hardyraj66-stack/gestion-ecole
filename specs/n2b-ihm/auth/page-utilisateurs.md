<a id="PAGE-AUT-002"></a>
# Utilisateurs

> **Couche** : N2b — QUOI écrans (page : Utilisateurs)
> **Acteur concerné** : [Administrateur](../../n1-acteurs/administrateur/_index.md)
> **UC sous-jacents** : [UC-AUT-004 à UC-AUT-008](../../n2a-domaine/bc-auth/_index.md)
> **Type de page** : Tableau + modale de création
> **Route** : `/utilisateurs` — protégée par `RequireAuth roles={['admin']}`
> **Source de données** : appels directs `fetch` vers `/users` (pas de hook `usePageFetch`)
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
| Rôle | `user.role` | `Select` éditable en ligne (admin / secrétaire / professeur) ; **désactivé sur soi-même** |
| Statut | `user.actif` | Badge « Actif » / « Inactif » |
| Actions | — | Voir ci-dessous |

---

## Actions par ligne

| Action | Comportement | Restriction |
|--------|-------------|-------------|
| Changer le rôle | `PATCH /users/:id { role }` (via le `Select`) | Désactivé sur soi-même |
| Réinitialiser le mot de passe | Invite (`prompt`) → `PATCH /users/:id/password { password }` (min. 4 car.) | — |
| Activer / Désactiver | `PATCH /users/:id { actif }` | Désactivé sur soi-même |
| Supprimer | Confirmation → `DELETE /users/:id` | Désactivé sur soi-même |

---

## Action de page

| Action | Comportement |
|--------|-------------|
| + Nouveau compte | Ouvre une modale : identifiant, nom, rôle, mot de passe → `POST /users` |

---

## Comportements & erreurs

| Situation | Comportement |
|-----------|-------------|
| Mot de passe < 4 caractères (création ou reset) | Erreur de validation, action bloquée |
| Identifiant déjà pris | Message « Cet identifiant existe déjà » dans la modale |
| Dernier admin actif (désactivation, changement de rôle, suppression) | Message « il doit rester au moins un administrateur actif » (boîte de dialogue) |
| Échec de chargement de la liste | Message d'erreur en haut de page |
