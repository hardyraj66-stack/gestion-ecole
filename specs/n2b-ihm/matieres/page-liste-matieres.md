<a id="PAGE-MAT-001"></a>
# Liste des matières

> **Couche** : N2b — QUOI écrans (page : Liste des matières)
> **Acteur concerné** : Direction
> **UC sous-jacents** : [UC-MAT-001](../../n2a-domaine/bc-matieres/_index.md), [UC-MAT-002](../../n2a-domaine/bc-matieres/_index.md), [UC-MAT-003](../../n2a-domaine/bc-matieres/_index.md)
> **Type de page** : Grille de cartes
> **Route** : `/matieres`
> **Hook de données** : `useMatieresListData` → `GET /read/matieres`
> **Ce fichier contient** : cartes matière, filtres, actions
> **Ce fichier NE contient PAS** : logique métier (→ N2a)

---

## Cartes matière

Chaque carte affiche :
- Bandeau coloré (couleur de la matière)
- Code matière (ex: `MATH`)
- Nom de la matière
- Coefficient global ou coefficients par niveau
- Badge « Inactive » si `actif: false`
- Actions : Modifier / Désactiver

---

## Filtres

| Filtre | Comportement |
|--------|-------------|
| Afficher inactives | Toggle — inclut les matières désactivées |

---

## Actions par carte

| Action | Comportement |
|--------|-------------|
| Modifier | Modal ou formulaire → `PATCH /matieres/:id` |
| Désactiver | Confirmation → `PATCH /matieres/:id/desactiver` |

---

## Actions de page

| Action | Comportement |
|--------|-------------|
| + Nouvelle matière | Navigue vers `/matieres/creer` |
