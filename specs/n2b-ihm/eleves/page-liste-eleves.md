<a id="PAGE-ELV-001"></a>
# Liste des élèves

> **Couche** : N2b — QUOI écrans (page : Liste des élèves)
> **Acteur concerné** : Secrétariat, Direction
> **UC sous-jacents** : [UC-ELV-001](../../n2a-domaine/bc-eleves/_index.md)
> **Type de page** : Liste paginée avec filtres
> **Route** : `/eleves`
> **Hook de données** : `useElevesListData` → `GET /read/eleves`
> **Ce fichier contient** : colonnes, filtres, pagination, actions
> **Ce fichier NE contient PAS** : logique métier (→ N2a)

---

## Colonnes

| Colonne | Source | Tri |
|---------|--------|-----|
| Nom | `eleve.nom` | oui |
| Prénom | `eleve.prenom` | oui |
| Genre | `eleve.genre` | — |
| Classe | `eleve.classe_nom` | oui |
| Niveau | `eleve.niveau` | oui |
| Statut | `eleve.statut` badge | — |
| Actions | — | — |

---

## Filtres et recherche

| Filtre | Comportement |
|--------|-------------|
| Recherche texte | Filtre sur `nom` + `prenom` |
| Filtre classe | Dropdown des classes actives |
| Filtre statut | `actif` / `exclu` / `parti` |

---

## Actions par ligne

| Action | Comportement |
|--------|-------------|
| Voir la fiche | Navigue vers `/eleves/:id` |

---

## Actions de page

| Action | Comportement |
|--------|-------------|
| + Inscrire un élève | Navigue vers `/eleves/inscrire` |

---

## Pagination

- Paramètres : `page`, `limit` (défaut 20)
- Contrôles standard avec indicateur de page
