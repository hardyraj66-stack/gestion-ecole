<a id="PAGE-EVA-001"></a>
# Liste des évaluations

> **Couche** : N2b — QUOI écrans (page : Liste des évaluations)
> **Acteur concerné** : Secrétariat
> **UC sous-jacents** : [UC-EVA-001](../../n2a-domaine/bc-evaluations/_index.md), [UC-EVA-004](../../n2a-domaine/bc-evaluations/_index.md)
> **Type de page** : Liste avec filtres
> **Route** : `/evaluations`
> **Hook de données** : `useEvaluationsListData`
> **Ce fichier contient** : colonnes, filtres, actions
> **Ce fichier NE contient PAS** : logique métier (→ N2a)

---

## Filtres

| Filtre | Comportement |
|--------|-------------|
| Classe | Dropdown des classes actives |
| Trimestre | 1 / 2 / 3 |
| Type | DS / Évaluation |
| Statut | Brouillon / Publié |

---

## Colonnes

| Colonne | Source | Tri |
|---------|--------|-----|
| Classe | `classe_nom` | oui |
| Matière | `matiere_nom` | oui |
| Type | `type` badge | — |
| Trimestre | `trimestre` | oui |
| Date | `date` | oui |
| Statut | `statut` badge | — |
| Actions | — | — |

---

## Actions par ligne

| Action | Comportement |
|--------|-------------|
| Voir / Saisir | Navigue vers `/evaluations/:id` |
| Supprimer | Confirmation → `DELETE /evaluations/:id` (brouillon seulement) |

---

## Actions de page

| Action | Comportement |
|--------|-------------|
| + Créer une évaluation | Modal de création → `POST /evaluations` |
