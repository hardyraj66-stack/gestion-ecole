<a id="PAGE-PRO-002"></a>
# Détail professeur

> **Couche** : N2b — QUOI écrans (page : Détail professeur)
> **Acteur concerné** : Direction
> **UC sous-jacents** : [UC-PRO-002](../../n2a-domaine/bc-professeurs/_index.md)
> **Type de page** : Fiche détail + liste d'affectations
> **Route** : `/professeurs/:id`
> **Hook de données** : `useProfesseurDetailData` → `GET /read/professeurs/:id`
> **Ce fichier contient** : sections informations, tableau des affectations
> **Ce fichier NE contient PAS** : logique métier (→ N2a)

---

## Section — Informations

| Champ | Source |
|-------|--------|
| Nom complet | `nom prenom` |
| Email | `email` |
| Téléphone | `telephone` |
| Genre | `genre` |
| Statut | badge `actif` / `inactif` |

**Actions** : [Modifier] → formulaire → `PATCH /professeurs/:id`

---

## Section — Affectations (TeacherAssignments)

Tableau des affectations de ce professeur :

| Colonne | Source |
|---------|--------|
| Classe | `classe_nom` |
| Matière | `matiere_nom` |
| Année scolaire | `annee_scolaire` |
| Actions | Supprimer |

**Actions** :
- [Ajouter une affectation] → modal : sélectionner classe + matière → `POST /teacher-assignments`
- [Supprimer] → `DELETE /teacher-assignments/:id`
