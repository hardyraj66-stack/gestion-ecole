<a id="PAGE-CLS-002"></a>
# Élèves d'une classe

> **Couche** : N2b — QUOI écrans (page : Élèves d'une classe)
> **Acteur concerné** : Secrétariat, Direction
> **UC sous-jacents** : [UC-ELV-001](../../n2a-domaine/bc-eleves/_index.md)
> **Type de page** : Liste + stats
> **Route** : `/classes/:id/eleves`
> **Hook de données** : `useClasseElevesData` → `GET /read/classes/:id/eleves`
> **Ce fichier contient** : colonnes, statistiques, actions, navigation
> **Ce fichier NE contient PAS** : logique métier (→ N2a)

---

## Structure visuelle

```
┌──────────────────────────────────────────────────────────────┐
│  ← Classes   6ème A                  [+ Inscrire un élève]   │
├──────────────────────────────────────────────────────────────┤
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────┐│
│  │ 28 élèves│ │ 14 filles│ │ 14 garçons│ │ 3 absences/jour  ││
│  └──────────┘ └──────────┘ └──────────┘ └──────────────────┘│
├──────────────────────────────────────────────────────────────┤
│  [Recherche]                                                  │
│  Nom | Prénom | Genre | Statut | Actions                     │
│  Jean  | Dupont | M | actif | [Fiche] [Notes]               │
│  ...                                                          │
└──────────────────────────────────────────────────────────────┘
```

---

## Cartes statistiques

| Carte | Donnée |
|-------|--------|
| Effectif total | `nb_eleves` |
| Filles | `nb_filles` |
| Garçons | `nb_garcons` |
| Absences du jour | `nb_absences` |

---

## Colonnes de la liste

| Colonne | Source | Tri |
|---------|--------|-----|
| Nom | `eleve.nom` | oui |
| Prénom | `eleve.prenom` | oui |
| Genre | `eleve.genre` (`M` / `F`) | — |
| Date de naissance | `eleve.date_naissance` | — |
| Statut | `eleve.statut` badge coloré | — |
| Actions | — | — |

---

## Actions par ligne

| Action | Comportement |
|--------|-------------|
| Fiche élève | Navigue vers `/eleves/:id` |
| Notes | Navigue vers la page notes filtrée sur cet élève |

---

## Actions de page

| Action | Comportement |
|--------|-------------|
| + Inscrire un élève | Navigue vers `/eleves/inscrire?classeId=:id` |
| ← Classes | Retour vers `/classes` |
