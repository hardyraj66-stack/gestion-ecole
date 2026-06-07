<a id="PA-PRF-002"></a>
# PA-PRF-002 — Consulter ses classes et ses élèves

> **Couche** : N1 — Parcours acteur
> **Acteur** : [Professeur](_index.md)
> **Domaine fonctionnel** : Classes · Élèves · Planning · Notes (bulletin)
> ⚠️ **Statut : Proposé (non implémenté).**

---

## Références

| Type | Lien |
|------|------|
| BC Classes | [bc-classes/_index.md](../../n2a-domaine/bc-classes/_index.md) |
| BC Élèves | [bc-eleves/_index.md](../../n2a-domaine/bc-eleves/_index.md) |
| BC Planning | [bc-planning/_index.md](../../n2a-domaine/bc-planning/_index.md) |
| Pages IHM | [classes](../../n2b-ihm/classes/_index.md) · [eleves](../../n2b-ihm/eleves/_index.md) · [planning](../../n2b-ihm/planning/_index.md) |

---

## Objectif

Consulter en **lecture seule** les classes où le professeur est affecté, les élèves qui les composent, le planning et les bulletins de ces élèves. Aucune création ni modification n'est possible via ce parcours.

---

## Pré-conditions

- Le professeur est connecté.
- Il a **au moins une affectation** (`TeacherAssignment`) sur l'année active.

---

## Parcours 1 — Consulter ses classes et leurs élèves

| # | Étape | Ref. UC | Ref. page |
|---|-------|---------|-----------|
| 1 | Naviguer vers Classes | — | [PAGE-CLS-001](../../n2b-ihm/classes/page-liste-classes.md) |
| 2 | La liste n'affiche **que ses classes** (périmètre serveur) | UC-PRO-005 *(proposé)* | — |
| 3 | Ouvrir une classe → liste des élèves (lecture seule) | — | [PAGE-CLS-002](../../n2b-ihm/classes/page-eleves-classe.md) |
| 4 | Ouvrir la fiche d'un élève de la classe | — | [PAGE-ELV-002](../../n2b-ihm/eleves/page-fiche-eleve.md) |

## Parcours 2 — Consulter un bulletin

| # | Étape | Ref. UC | Ref. page |
|---|-------|---------|-----------|
| 1 | Depuis la fiche d'un de ses élèves → Bulletin | — | [PAGE-NOT-002](../../n2b-ihm/notes/page-bulletin.md) |
| 2 | Le bulletin **complet** (toutes matières) s'affiche en lecture seule | — | — |

## Parcours 3 — Consulter le planning de ses classes

| # | Étape | Ref. UC | Ref. page |
|---|-------|---------|-----------|
| 1 | Naviguer vers Planning | — | [PAGE-PLN-001](../../n2b-ihm/planning/page-planning-global.md) |
| 2 | Le planning affiché est limité à ses créneaux / ses classes | UC-PRO-005 *(proposé)* | — |

---

## Résultat

Le professeur dispose d'une vue de consultation centrée sur son périmètre, sans pouvoir modifier les données.

## Cas d'erreur

| Situation | Comportement |
|-----------|-------------|
| Professeur sans aucune affectation | Tableau de bord et listes vides + message « aucune classe affectée » |
| Accès direct à l'URL d'une classe/élève **hors périmètre** | Réponse serveur `403` (le filtrage n'est pas qu'un masquage front) |
| Tentative d'action de modification (création, édition, suppression) | Action indisponible (boutons masqués) ; refus `403` côté serveur si forcée |
