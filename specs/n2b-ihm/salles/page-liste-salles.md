<a id="PAGE-SAL-001"></a>
# Liste des salles

> **Couche** : N2b — QUOI écrans (page : Liste des salles)
> **Acteur concerné** : Direction, Secrétariat
> **UC sous-jacents** : [UC-SAL-001](../../n2a-domaine/bc-salles/_index.md), [UC-SAL-003](../../n2a-domaine/bc-salles/_index.md), [UC-SAL-004](../../n2a-domaine/bc-salles/_index.md)
> **Type de page** : Grille de cartes
> **Route** : `/salles`
> **Hook de données** : `useSallesListData` → `GET /read/salles`
> **Ce fichier contient** : cartes salle, filtres, actions
> **Ce fichier NE contient PAS** : logique métier (→ N2a)

---

## Structure visuelle

```
┌──────────────────────────────────────────────────────────────┐
│  Salles                                  [+ Nouvelle salle]   │
├──────────────────────────────────────────────────────────────┤
│  [Recherche]  [Type ▼]  [Bâtiment ▼]                         │
├──────────────────────────────────────────────────────────────┤
│  ┌───────────────┐ ┌───────────────┐ ┌───────────────┐       │
│  │ Salle 101     │ │ Labo sciences │ │ Salle info    │       │
│  │ standard      │ │ laboratoire   │ │ informatique  │       │
│  │ 30 places     │ │ 24 places     │ │ 20 places     │       │
│  │ Bât A, RDC    │ │ Bât B, 1er   │ │ Bât C, 2ème  │       │
│  │[Détail][Modif]│ │[Détail][Modif]│ │[Détail][Modif]│       │
│  └───────────────┘ └───────────────┘ └───────────────┘       │
└──────────────────────────────────────────────────────────────┘
```

---

## Cartes salle

Chaque carte affiche :
- Nom de la salle
- Type (badge)
- Capacité
- Bâtiment + étage
- Équipements (icônes)
- Badge PMR si `accessible_pmr: true`

---

## Filtres

| Filtre | Comportement |
|--------|-------------|
| Recherche texte | Filtre sur nom en temps réel |
| Type | `standard / laboratoire / informatique / sport / arts / amphi / autre` |
| Bâtiment | Dropdown des bâtiments existants |

---

## Actions par carte

| Action | Comportement |
|--------|-------------|
| Détail | Navigue vers `/salles/:id` |
| Modifier | Modal d'édition → `PATCH /salles/:id` |
| Supprimer | Vérification usage → `DELETE /salles/:id` — si en usage, confirmation avec force=true |

---

## Actions de page

| Action | Comportement |
|--------|-------------|
| + Nouvelle salle | Navigue vers `/salles/creer` |
