<a id="PAGE-NOT-001"></a>
# Saisie des notes

> **Couche** : N2b — QUOI écrans (page : Saisie des notes)
> **Acteur concerné** : Secrétariat
> **UC sous-jacents** : [UC-NOT-001](../../n2a-domaine/bc-notes/_index.md), [UC-NOT-002](../../n2a-domaine/bc-notes/_index.md), [UC-NOT-003](../../n2a-domaine/bc-notes/_index.md)
> **Type de page** : Grille de saisie + liste
> **Route** : `/notes`
> **Hook de données** : `useNotesPageData` → `GET /read/notes`, `useNotesFiltersData` → `GET /read/notes/filters`
> **Ce fichier contient** : filtres, grille de saisie, actions
> **Ce fichier NE contient PAS** : logique métier (→ N2a)

---

## Structure visuelle

```
┌──────────────────────────────────────────────────────────────┐
│  Notes                                  [+ Ajouter une note] │
├──────────────────────────────────────────────────────────────┤
│  [Classe ▼]  [Matière ▼]  [Trimestre ▼]                      │
├──────────────────────────────────────────────────────────────┤
│  Élève | Valeur | Type | Date | Commentaire | Statut | Actions│
│  Jean Dupont | 14.5 | DS | 15/01/2025 | Bon travail | — | ✏️🚫│
│  ...                                                          │
└──────────────────────────────────────────────────────────────┘
```

---

## Filtres

| Filtre | Comportement | Requis |
|--------|-------------|--------|
| Classe | Dropdown des classes actives | oui |
| Matière | Dropdown des matières de la classe sélectionnée | oui |
| Trimestre | 1 / 2 / 3 | oui |

---

## Colonnes

| Colonne | Source | Tri |
|---------|--------|-----|
| Élève | `eleve.nom prenom` | oui |
| Valeur | `valeur` (sur 20) | oui |
| Type | `type` (DS / Évaluation / —) | — |
| Date | `date` | oui |
| Commentaire | `commentaire` | — |
| Statut | Badge « Annulée » si `annulee: true` | — |
| Actions | — | — |

---

## Actions par ligne

| Action | Comportement |
|--------|-------------|
| Modifier | Ouvre formulaire inline → `PATCH /notes/:id` |
| Annuler | Confirmation → `PATCH /notes/:id/annuler` |

---

## Formulaire d'ajout de note

Déclenché par « + Ajouter une note » ou depuis la fiche élève.

| Champ | Type | Requis |
|-------|------|--------|
| Élève | Select (filtrés par classe) | oui |
| Matière | Select | oui |
| Trimestre | Select 1/2/3 | oui |
| Valeur | Number 0–20 | oui |
| Type | Select DS / Évaluation / — | non |
| Date | Date | oui |
| Commentaire | Text | non |

**Action** : `POST /notes`
