<a id="PA-SEC-003"></a>
# PA-SEC-003 — Saisir les notes

> **Couche** : N1 — Parcours acteur
> **Acteur** : [Secrétariat](_index.md)
> **Domaine fonctionnel** : Notes

---

## Références

| Type | Lien |
|------|------|
| BC Notes | [bc-notes/_index.md](../../n2a-domaine/bc-notes/_index.md) |
| Pages IHM | [n2b-ihm/notes/_index.md](../../n2b-ihm/notes/_index.md) |

---

## Objectif

Saisir ou mettre à jour les notes des élèves d'une classe pour une matière et un trimestre donnés, en mode DS ou Évaluation. Consulter les statistiques en temps réel.

---

## Pré-conditions

- Une classe active avec des élèves
- Une matière rattachée au niveau de la classe
- Un trimestre (1, 2 ou 3)

---

## Parcours 1 — Saisir les notes d'une classe

| # | Étape | Ref. UC | Ref. page |
|---|-------|---------|-----------|
| 1 | Naviguer vers Notes | — | [PAGE-NOT-001](../../n2b-ihm/notes/page-saisie-notes.md) |
| 2 | Sélectionner la classe | UC-NOT-001 | — |
| 3 | Sélectionner la matière | UC-NOT-001 | — |
| 4 | Sélectionner le trimestre (1, 2 ou 3) | UC-NOT-001 | — |
| 5 | Sélectionner le type de note (DS ou Évaluation) | UC-NOT-001 | — |
| 6 | La liste des élèves s'affiche avec leurs notes existantes | — | — |
| 7 | Saisir la note (0–20) dans le champ de chaque élève | UC-NOT-001 | — |
| 8 | Cliquer "Enregistrer" par ligne ou "Tout enregistrer" | UC-NOT-001 | — |
| 9 | Les statistiques (moyenne, min, max) se mettent à jour | — | — |

## Parcours 2 — Modifier ou annuler une note

| # | Étape | Ref. UC | Ref. page |
|---|-------|---------|-----------|
| 1 | Depuis la page de saisie, localiser l'élève dont la note est erronée | — | — |
| 2 | Modifier la valeur dans le champ → "Enregistrer" | UC-NOT-002 | — |
| 3 | Ou cliquer "Annuler" → la note est marquée annulée (ne compte plus dans les calculs) | UC-NOT-004 | — |

## Résultat

Notes enregistrées et disponibles dans les bulletins de chaque élève.

## Cas d'erreur

| Situation | Comportement |
|-----------|-------------|
| Valeur hors de 0–20 | Champ en erreur, enregistrement bloqué |
| Aucune classe sélectionnée | Liste élèves non affichée |
