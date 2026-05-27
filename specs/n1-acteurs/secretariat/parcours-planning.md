<a id="PA-SEC-004"></a>
# PA-SEC-004 — Gérer le planning

> **Couche** : N1 — Parcours acteur
> **Acteur** : [Secrétariat](_index.md)
> **Domaine fonctionnel** : Planning

---

## Références

| Type | Lien |
|------|------|
| BC Planning | [bc-planning/_index.md](../../n2a-domaine/bc-planning/_index.md) |
| Pages IHM | [n2b-ihm/planning/_index.md](../../n2b-ihm/planning/_index.md) |

---

## Objectif

Créer et maintenir le planning hebdomadaire type de chaque classe. Gérer les créneaux (matière, horaire, salle, professeur), détecter et résoudre les conflits de salle.

---

## Parcours 1 — Créer un créneau

| # | Étape | Ref. UC | Ref. page |
|---|-------|---------|-----------|
| 1 | Naviguer vers Planning, sélectionner une classe | — | [PAGE-PLN-001](../../n2b-ihm/planning/page-planning.md) |
| 2 | Cliquer sur une cellule vide de la grille (icône "+") | — | — |
| 3 | Choisir la matière, le jour (pré-rempli), l'heure de début et de fin | UC-PLN-002 | — |
| 4 | Sélectionner la salle dans le sélecteur (salles disponibles surlignées) | UC-PLN-002 | — |
| 5 | Choisir optionnellement le professeur | UC-PLN-002 | — |
| 6 | Valider → créneau créé sur la grille | UC-PLN-002 | — |

## Parcours 2 — Déplacer un créneau (glisser-déposer)

| # | Étape | Ref. UC | Ref. page |
|---|-------|---------|-----------|
| 1 | Cliquer et maintenir sur un créneau existant | — | — |
| 2 | Faire glisser vers la nouvelle position sur la grille | UC-PLN-003 | — |
| 3 | Relâcher → créneau déplacé si aucun conflit | UC-PLN-003 | — |
| 3b | Si conflit de salle → message d'erreur, créneau non déplacé | UC-PLN-003 | — |

## Parcours 3 — Modifier ou supprimer un créneau

| # | Étape | Ref. UC | Ref. page |
|---|-------|---------|-----------|
| 1 | Cliquer sur un créneau existant → modale d'édition | — | — |
| 2 | Modifier les champs souhaités → Enregistrer | UC-PLN-003 | — |
| 3 | Ou cliquer "Supprimer" → confirmation → créneau supprimé | UC-PLN-004 | — |

## Résultat

Planning complet et sans conflit de salle. Chaque classe a ses créneaux visibles sur la grille.

## Cas d'erreur

| Situation | Comportement |
|-----------|-------------|
| Salle déjà occupée sur le créneau demandé | Message d'erreur explicite avec le nom de la classe occupante |
| Classe déjà occupée sur ce créneau | Message d'erreur |
| Créneau hors des horaires de l'établissement | Impossible à poser sur la grille |
