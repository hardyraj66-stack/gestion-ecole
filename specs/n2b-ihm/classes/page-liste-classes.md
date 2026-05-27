<a id="PAGE-CLS-001"></a>
# Liste des classes

> **Couche** : N2b — QUOI écrans (page : Liste des classes)
> **Acteur concerné** : Secrétariat, Direction
> **UC sous-jacents** : [UC-CLS-001](../../n2a-domaine/bc-classes/_index.md), [UC-CLS-003](../../n2a-domaine/bc-classes/_index.md)
> **Type de page** : Liste paginée
> **Route** : `/classes`
> **Hook de données** : `useClassesListData` → `GET /read/classes`
> **Ce fichier contient** : colonnes, filtres, actions, états vides
> **Ce fichier NE contient PAS** : logique métier (→ N2a)

---

## Structure visuelle

```
┌──────────────────────────────────────────────────────────────┐
│  Classes                          [+ Nouvelle classe]         │
├──────────────────────────────────────────────────────────────┤
│  [Recherche]  [Filtre niveau ▼]                               │
├──────────────────────────────────────────────────────────────┤
│  Nom | Niveau | Effectif | Salle | Actions                    │
│  ──────────────────────────────────────────────────────────── │
│  6ème A | 6ème | 28 | Salle 1 | [Voir élèves] [Modifier]    │
│  ...                                                          │
├──────────────────────────────────────────────────────────────┤
│  Page 1 / N                              [Précédent] [Suivant]│
└──────────────────────────────────────────────────────────────┘
```

---

## Colonnes

| Colonne | Source | Tri | Description |
|---------|--------|-----|-------------|
| Nom | `classe.nom` | oui | Nom de la classe |
| Niveau | `classe.niveau` | oui | Nom du niveau scolaire |
| Effectif | `classe.nb_eleves` | oui | Nombre d'élèves actifs |
| Salle | `classe.salle` | — | Salle fixe ou « Variable » |
| Actions | — | — | Boutons Voir / Modifier / Désactiver |

---

## Filtres et recherche

| Filtre | Comportement |
|--------|-------------|
| Recherche texte | Filtre sur `nom` en temps réel |
| Filtre niveau | Dropdown — liste les niveaux disponibles |

---

## Actions par ligne

| Action | Cible | Comportement |
|--------|-------|-------------|
| Voir les élèves | Ligne | Navigue vers `/classes/:id/eleves` |
| Modifier | Ligne | Ouvre le formulaire d'édition en drawer ou modal |
| Désactiver | Ligne | Confirmation → `PATCH /classes/:id/desactiver` |

---

## Actions de page

| Action | Comportement |
|--------|-------------|
| + Nouvelle classe | Navigue vers `/classes/creer` |

---

## Pagination

- Paramètres : `page`, `limit` (défaut 20)
- Contrôles : « Précédent » / « Suivant » + indicateur « Page X / N »

---

## États vides

| Situation | Message |
|-----------|---------|
| Aucune classe | « Aucune classe créée. Commencez par configurer les niveaux puis créer des classes. » |
| Recherche sans résultat | « Aucune classe ne correspond à votre recherche. » |
