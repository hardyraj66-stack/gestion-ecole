<a id="PAGE-NIV-001"></a>
# Liste des niveaux

> **Couche** : N2b — QUOI écrans (page : Liste des niveaux)
> **Acteur concerné** : Direction
> **UC sous-jacents** : [UC-NIV-001 à UC-NIV-004](../../n2a-domaine/bc-niveaux/_index.md)
> **Type de page** : Liste ordonnée avec drag-and-drop
> **Route** : `/niveaux`
> **Hook de données** : `useNiveauxListData` → `GET /read/niveaux`
> **Ce fichier contient** : colonnes, actions, réordonnancement
> **Ce fichier NE contient PAS** : logique métier (→ N2a)

---

## Structure visuelle

```
┌──────────────────────────────────────────────────────────────┐
│  Niveaux scolaires                      [+ Nouveau niveau]    │
├──────────────────────────────────────────────────────────────┤
│  # | Nom      | Matières associées | Actions                  │
│  1 | 6ème     | MATH, FR, HG, ANG  | [Modifier] [Supprimer] │
│  2 | 5ème     | MATH, FR, HG, ANG  | [Modifier] [Supprimer] │
│  3 | 4ème     | MATH, FR, HG, ANG  | [Modifier] [Supprimer] │
│  ...                                                          │
│  [Réordonner]                                                 │
└──────────────────────────────────────────────────────────────┘
```

---

## Colonnes

| Colonne | Source |
|---------|--------|
| Ordre | `ordre` |
| Nom | `nom` |
| Matières | Liste des codes des matières associées (`matiere_ids`) |
| Actions | Modifier / Supprimer |

---

## Actions par ligne

| Action | Comportement |
|--------|-------------|
| Modifier | Modal d'édition → `PATCH /niveaux/:id` |
| Supprimer | Confirmation → `DELETE /niveaux/:id` — bloqué si classes actives |

---

## Actions de page

| Action | Comportement |
|--------|-------------|
| + Nouveau niveau | Navigue vers `/niveaux/creer` |
| Réordonner | Déclenche `POST /niveaux/recompact` pour normaliser les ordres |
