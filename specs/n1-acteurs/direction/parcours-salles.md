<a id="PA-DIR-002"></a>
# PA-DIR-002 — Gérer les salles

> **Couche** : N1 — Parcours acteur
> **Acteur** : [Direction](_index.md)
> **Domaine fonctionnel** : Salles

---

## Références

| Type | Lien |
|------|------|
| BC Salles | [bc-salles/_index.md](../../n2a-domaine/bc-salles/_index.md) |
| Pages IHM | [n2b-ihm/salles/_index.md](../../n2b-ihm/salles/_index.md) |

---

## Parcours 1 — Créer une salle

| # | Étape | Ref. UC | Ref. page |
|---|-------|---------|-----------|
| 1 | Naviguer vers Salles → "Nouvelle salle" | — | [PAGE-SAL-003](../../n2b-ihm/salles/page-creer-salle.md) |
| 2 | Saisir le nom, la capacité, le type, le bâtiment, l'étage | UC-SAL-001 | — |
| 3 | Cocher les équipements disponibles et l'accessibilité PMR | UC-SAL-001 | — |
| 4 | Valider → salle disponible dans les sélecteurs de planning | UC-SAL-001 | — |

## Parcours 2 — Consulter l'occupation d'une salle

| # | Étape | Ref. UC | Ref. page |
|---|-------|---------|-----------|
| 1 | Depuis la liste des salles → "Détail" sur une carte | UC-SAL-002 | [PAGE-SAL-002](../../n2b-ihm/salles/page-detail-salle.md) |
| 2 | Consulter les statistiques : créneaux/semaine, taux d'occupation | — | — |
| 3 | Consulter les créneaux qui utilisent cette salle | — | — |

## Parcours 3 — Modifier ou supprimer une salle

| # | Étape | Ref. UC | Ref. page |
|---|-------|---------|-----------|
| 1 | Depuis la liste des salles → "Modifier" sur une carte | UC-SAL-003 | — |
| 2 | Modifier les champs souhaités → Enregistrer | UC-SAL-003 | — |
| 3 | Ou cliquer "Supprimer" → confirmation | UC-SAL-004 | — |
