<a id="PA-SEC-001"></a>
# PA-SEC-001 — Gérer les classes

> **Couche** : N1 — Parcours acteur
> **Acteur** : [Secrétariat](_index.md)
> **Domaine fonctionnel** : Classes
> **Ce fichier contient** : objectif, pré-conditions, étapes, résultat, cas d'erreur
> **Ce fichier NE contient PAS** : colonnes/layout (→ N2b), logique métier/règles (→ N2a), patterns techniques (→ N3)

---

## Références

| Type | Lien |
|------|------|
| BC Classes | [bc-classes/_index.md](../../n2a-domaine/bc-classes/_index.md) |
| Pages IHM | [n2b-ihm/classes/_index.md](../../n2b-ihm/classes/_index.md) |

---

## Objectif

Gérer l'ensemble des classes de l'établissement : consultation de la liste, création de nouvelles classes, consultation des élèves par classe, navigation vers le planning.

---

## Pré-conditions

- Année scolaire active configurée
- Au moins un niveau scolaire existant
- Au moins une salle existante (si salle_type = fixe)

---

## Parcours 1 — Consulter la liste des classes

| # | Étape | Ref. UC | Ref. page |
|---|-------|---------|-----------|
| 1 | Naviguer vers Classes dans la barre latérale | — | [PAGE-CLS-001](../../n2b-ihm/classes/page-liste-classes.md) |
| 2 | Parcourir la liste des classes (cartes) | UC-CLS-001 | — |
| 3 | Filtrer par niveau ou rechercher par nom | UC-CLS-001 | — |
| 4 | Cliquer sur "Voir les élèves" → accède aux élèves de la classe | UC-CLS-002 | [PAGE-CLS-002](../../n2b-ihm/classes/page-eleves-classe.md) |
| 5 | Cliquer sur "Planning" → accède au planning de la classe | UC-PLN-001 | [PAGE-PLN-001](../../n2b-ihm/planning/page-planning.md) |

## Parcours 2 — Créer une classe

| # | Étape | Ref. UC | Ref. page |
|---|-------|---------|-----------|
| 1 | Cliquer sur "Nouvelle classe" | — | [PAGE-CLS-003](../../n2b-ihm/classes/page-creer-classe.md) |
| 2 | Renseigner le nom (ex: "6ème A") | UC-CLS-003 | — |
| 3 | Sélectionner le niveau | UC-CLS-003 | — |
| 4 | Renseigner la capacité | UC-CLS-003 | — |
| 5 | Choisir le type de salle : fixe ou variable | UC-CLS-003 | — |
| 6 | Si fixe : sélectionner la salle dans la liste | UC-CLS-003 | — |
| 7 | Valider → classe créée, retour à la liste | UC-CLS-003 | — |

## Résultat

Classes consultables et filtrables. Nouvelle classe disponible dans toutes les listes de l'application (notes, planning, élèves).

## Cas d'erreur

| Situation | Comportement |
|-----------|-------------|
| Aucune année active | Message informatif, redirection vers Année scolaire |
| Aucun niveau configuré | Champ niveau vide, création bloquée |
| Salle fixe non sélectionnée | Validation bloquée avec message explicite |
