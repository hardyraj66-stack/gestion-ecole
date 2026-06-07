<a id="PA-PRF-003"></a>
# PA-PRF-003 — Saisir notes et évaluations

> **Couche** : N1 — Parcours acteur
> **Acteur** : [Professeur](_index.md)
> **Domaine fonctionnel** : Notes · Évaluations
> ⚠️ **Statut : Proposé (non implémenté).**

---

## Références

| Type | Lien |
|------|------|
| BC Notes | [bc-notes/_index.md](../../n2a-domaine/bc-notes/_index.md) |
| BC Évaluations | [bc-evaluations/_index.md](../../n2a-domaine/bc-evaluations/_index.md) |
| Pages IHM | [notes](../../n2b-ihm/notes/_index.md) · [evaluations](../../n2b-ihm/evaluations/_index.md) |

---

## Objectif

Saisir et mettre à jour les notes et les évaluations, **uniquement pour les couples (classe, matière) où le professeur est affecté**. Toute autre combinaison lui est inaccessible.

---

## Pré-conditions

- Le professeur est connecté.
- Il possède au moins une affectation `TeacherAssignment` (couple classe ↔ matière) sur l'année active.

---

## Parcours 1 — Saisir les notes de sa matière

| # | Étape | Ref. UC | Ref. page |
|---|-------|---------|-----------|
| 1 | Naviguer vers Notes | — | [PAGE-NOT-001](../../n2b-ihm/notes/page-notes.md) |
| 2 | Les sélecteurs **classe** et **matière** ne proposent que ses couples affectés | UC-PRF-006 *(proposé)* | — |
| 3 | Sélectionner le trimestre (1, 2 ou 3) | UC-NOT-001 | — |
| 4 | Saisir / modifier les notes des élèves (0–20) → Enregistrer | UC-NOT-001 · UC-NOT-002 | — |

## Parcours 2 — Gérer une évaluation de sa matière

| # | Étape | Ref. UC | Ref. page |
|---|-------|---------|-----------|
| 1 | Naviguer vers Périodes / Évaluations | — | [PAGE-EVA-001](../../n2b-ihm/evaluations/page-liste-evaluations.md) |
| 2 | La liste et la création sont limitées à ses couples (classe, matière) | UC-PRF-006 *(proposé)* | — |
| 3 | Créer une évaluation, saisir les notes, publier | UC-EVA-001 *(et suivants)* | [PAGE-EVA-002](../../n2b-ihm/evaluations/page-detail-evaluation.md) |

---

## Résultat

Notes et évaluations enregistrées et visibles dans les bulletins, dans la limite stricte du périmètre du professeur.

## Cas d'erreur

| Situation | Comportement |
|-----------|-------------|
| Tentative de saisie sur une classe ou matière **non affectée** (via l'IHM ou directement l'API) | Refus serveur `403` |
| Valeur de note hors 0–20 | Champ en erreur, enregistrement bloqué (RG des notes) |
| Affectation retirée pendant la session | Le couple disparaît des sélecteurs au prochain rafraîchissement (live via Socket.IO) |
