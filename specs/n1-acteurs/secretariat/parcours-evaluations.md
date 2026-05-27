<a id="PA-SEC-006"></a>
# PA-SEC-006 — Gérer les évaluations

> **Couche** : N1 — Parcours acteur
> **Acteur** : [Secrétariat](_index.md)
> **Domaine fonctionnel** : Évaluations

---

## Références

| Type | Lien |
|------|------|
| BC Évaluations | [bc-evaluations/_index.md](../../n2a-domaine/bc-evaluations/_index.md) |
| Pages IHM | [n2b-ihm/evaluations/_index.md](../../n2b-ihm/evaluations/_index.md) |

---

## Parcours 1 — Créer une évaluation et saisir les notes

| # | Étape | Ref. UC | Ref. page |
|---|-------|---------|-----------|
| 1 | Évaluations → Liste → "Nouvelle évaluation" | — | [PAGE-EVA-003](../../n2b-ihm/evaluations/page-creer-evaluation.md) |
| 2 | Choisir le type (DS / Évaluation), la classe, la matière, le trimestre, la date | UC-EVA-001 | — |
| 3 | Valider → évaluation créée en statut Brouillon, redirection vers la saisie | UC-EVA-001 | [PAGE-EVA-004](../../n2b-ihm/evaluations/page-detail-evaluation.md) |
| 4 | Pour chaque élève : saisir la note (0–20) ou cocher "Absent" | UC-EVA-002 | — |
| 5 | Cliquer "Enregistrer les notes" | UC-EVA-002 | — |
| 6 | Cliquer "Publier" → confirmation → évaluation publiée | UC-EVA-003 | — |
| 7 | Les notes sont automatiquement créées dans la collection Notes | — | — |

## Parcours 2 — Configurer les périodes d'évaluation

| # | Étape | Ref. UC | Ref. page |
|---|-------|---------|-----------|
| 1 | Évaluations → Périodes | — | [PAGE-EVA-001](../../n2b-ihm/evaluations/page-periodes.md) |
| 2 | Pour chaque période (DS / Évaluation × 3 trimestres) : renseigner les dates de début et de fin | UC-EVA-005 | — |
| 3 | Cliquer "Terminer" pour clôturer une période | UC-EVA-006 | — |

## Résultat

Évaluations publiées et notes disponibles dans les bulletins. Périodes configurées pour l'année.

## Cas d'erreur

| Situation | Comportement |
|-----------|-------------|
| Tentative de publication sans aucune note saisie | Avertissement, publication possible après confirmation |
| Évaluation déjà publiée | Mode lecture seule, bouton Publier masqué |
| Tentative de suppression d'une évaluation publiée | Action bloquée |
