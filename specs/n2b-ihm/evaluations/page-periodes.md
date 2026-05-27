<a id="PAGE-EVA-003"></a>
# Périodes d'évaluation

> **Couche** : N2b — QUOI écrans (page : Périodes d'évaluation)
> **Acteur concerné** : Secrétariat
> **UC sous-jacents** : configuration des périodes
> **Type de page** : Configuration / tableau
> **Route** : `/evaluations/periodes`
> **Ce fichier contient** : tableau des périodes, édition des dates
> **Ce fichier NE contient PAS** : logique métier (→ N2a)

---

## Structure

Tableau des périodes par trimestre et par type (DS / Évaluation) :

| Trimestre | Type | Date début | Date fin | Terminée | Actions |
|-----------|------|-----------|---------|----------|---------|
| 1 | DS | 15/09/2024 | 30/10/2024 | — | [Modifier] [Terminer] |
| 1 | Évaluation | 15/09/2024 | 30/10/2024 | — | [Modifier] [Terminer] |
| 2 | DS | — | — | — | [Modifier] |
| ... | | | | | |

---

## Actions par ligne

| Action | Comportement |
|--------|-------------|
| Modifier | Éditer les dates → `PATCH /periodes/:id` |
| Terminer | Confirmation → `PATCH /periodes/:id/terminer` — marque la période comme close |

---

## Initialisation

Si aucune période n'existe pour l'année active :
- Bouton « Initialiser les périodes » → `POST /periodes/init` avec `{ annee_scolaire }`
- Crée 6 périodes (3 trimestres × 2 types)
