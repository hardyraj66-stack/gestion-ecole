<a id="PA-DIR-003"></a>
# PA-DIR-003 — Gérer les professeurs

> **Couche** : N1 — Parcours acteur
> **Acteur** : [Direction](_index.md)
> **Domaine fonctionnel** : Professeurs / Affectations

---

## Références

| Type | Lien |
|------|------|
| BC Professeurs | [bc-professeurs/_index.md](../../n2a-domaine/bc-professeurs/_index.md) |
| Pages IHM | [n2b-ihm/professeurs/_index.md](../../n2b-ihm/professeurs/_index.md) |

---

## Parcours 1 — Créer un profil professeur

| # | Étape | Ref. UC | Ref. page |
|---|-------|---------|-----------|
| 1 | Naviguer vers Professeurs → "Nouveau professeur" | — | [PAGE-PRO-002](../../n2b-ihm/professeurs/page-creer-professeur.md) |
| 2 | Saisir le nom, le prénom, le contact (téléphone, email) | UC-PRO-001 | — |
| 3 | Valider → profil créé, disponible dans les affectations | UC-PRO-001 | — |

## Parcours 2 — Affecter un professeur à une classe/matière

| # | Étape | Ref. UC | Ref. page |
|---|-------|---------|-----------|
| 1 | Depuis la liste des professeurs → "Détail" sur un professeur | UC-PRO-002 | [PAGE-PRO-001](../../n2b-ihm/professeurs/page-detail-professeur.md) |
| 2 | Consulter les affectations existantes (tableau classe + matière) | — | — |
| 3 | Cliquer "Ajouter une affectation" → sélectionner la classe et la matière | UC-PRO-002 | — |
| 4 | Valider → affectation enregistrée, professeur visible dans le planning | UC-PRO-002 | — |

## Parcours 3 — Modifier ou supprimer un professeur

| # | Étape | Ref. UC | Ref. page |
|---|-------|---------|-----------|
| 1 | Depuis la liste des professeurs → "Modifier" sur une carte | UC-PRO-003 | — |
| 2 | Modifier les champs souhaités → Enregistrer | UC-PRO-003 | — |
| 3 | Ou cliquer "Supprimer" → confirmation | UC-PRO-004 | — |

## Cas d'erreur

| Situation | Comportement |
|-----------|-------------|
| Affectation déjà existante (même classe + matière) | Avertissement, doublon bloqué |
| Suppression d'un professeur avec des créneaux actifs | Action bloquée ou avertissement |
