<a id="PAGE-PRO-001"></a>
# Liste des professeurs

> **Couche** : N2b — QUOI écrans (page : Liste des professeurs)
> **Acteur concerné** : Direction
> **UC sous-jacents** : [UC-PRO-001 à UC-PRO-004](../../n2a-domaine/bc-professeurs/_index.md)
> **Type de page** : Tableau + cartes
> **Route** : `/professeurs`
> **Hook de données** : `useProfesseursListData` → `GET /read/professeurs`
> **Ce fichier contient** : colonnes, filtres, actions
> **Ce fichier NE contient PAS** : logique métier (→ N2a)

---

## Colonnes

| Colonne | Source | Tri |
|---------|--------|-----|
| Nom | `professeur.nom` | oui |
| Prénom | `professeur.prenom` | oui |
| Email | `professeur.email` | — |
| Téléphone | `professeur.telephone` | — |
| Statut | `professeur.statut` badge | — |
| Affectations | Nombre de classes/matières | — |
| Actions | — | — |

---

## Filtres

| Filtre | Comportement |
|--------|-------------|
| Afficher inactifs | Toggle |

---

## Actions par ligne

| Action | Comportement |
|--------|-------------|
| Voir la fiche | Navigue vers `/professeurs/:id` |
| Désactiver / Activer | `PATCH /professeurs/:id/desactiver` ou `/activer` |

---

## Actions de page

| Action | Comportement |
|--------|-------------|
| + Nouveau professeur | Navigue vers `/professeurs/creer` |
