<a id="PAGE-ELV-002"></a>
# Fiche élève

> **Couche** : N2b — QUOI écrans (page : Fiche élève)
> **Acteur concerné** : Secrétariat, Direction
> **UC sous-jacents** : [UC-ELV-002](../../n2a-domaine/bc-eleves/_index.md), [UC-ELV-003](../../n2a-domaine/bc-eleves/_index.md), [UC-SUI-001 à UC-SUI-008](../../n2a-domaine/bc-suivi/_index.md)
> **Type de page** : Hub entité à onglets
> **Route** : `/eleves/:id`
> **Hook de données** : `useEleveFicheData` → `GET /read/eleves/:id/fiche`
> **Ce fichier contient** : onglets, sections, actions disponibles
> **Ce fichier NE contient PAS** : logique métier (→ N2a)

---

## Structure — Onglets

| Onglet | Contenu |
|--------|---------|
| Informations | Données personnelles, familiales, classe actuelle |
| Notes | Tableau des notes par trimestre et par matière |
| Bulletin | Bulletin trimestriel calculé |
| Suivi | Absences, retards, avertissements, convocations |

---

## Onglet Informations

### Section — Identité

| Champ | Source |
|-------|--------|
| Nom complet | `nom prenom` |
| Date de naissance | `date_naissance` |
| Genre | `genre` |
| Adresse | `adresse` |
| Email | `email` |
| Téléphone | `telephone` |

### Section — Classe actuelle

| Champ | Source |
|-------|--------|
| Classe | `classe_nom` |
| Niveau | `niveau` |
| Année scolaire | `annee_scolaire` |

### Section — Famille

| Champ | Source |
|-------|--------|
| Père | `pere.nom prenom, telephone, email, statut` |
| Mère | `mere.nom prenom, telephone, email, statut` |
| Tuteur | `tuteur.nom prenom, telephone, email, lien` |

**Actions** :
- [Modifier les informations] → `PATCH /eleves/:id` (formulaire inline ou modal)
- [Changer de classe] → `PATCH /eleves/:id` (champ `classe_id`)
- [Exclure l'élève] → `PATCH /eleves/:id` avec `statut: 'exclu'` + confirmation
- [Enregistrer un départ] → `PATCH /eleves/:id` avec `statut: 'parti'` + confirmation

---

## Onglet Notes

Tableau des notes de l'élève, groupées par trimestre.

| Colonne | Source |
|---------|--------|
| Matière | `matiere_nom` |
| Trimestre | `trimestre` |
| Valeur | `valeur` |
| Date | `date` |
| Type | `type` (DS / Évaluation / —) |
| Statut | Badge « Annulée » si `annulee: true` |

**Actions** : Modifier / Annuler une note via `PATCH /notes/:id` ou `PATCH /notes/:id/annuler`

---

## Onglet Bulletin

Affichage du bulletin trimestriel de l'élève : moyennes par matière, moyenne générale, rang.

Filtre trimestre : 1 / 2 / 3

---

## Onglet Suivi

### Absences et retards

| Colonne | Source |
|---------|--------|
| Date | `date` |
| Type | `type` (Absence / Retard) |
| Durée | `duree` |
| Motif | `motif` |
| Justifiée | badge |

**Actions** : Ajouter / Supprimer

### Avertissements

| Colonne | Source |
|---------|--------|
| Date | `date` |
| Type | `type` |
| Motif | `motif` |
| Commentaire | `commentaire` |

**Actions** : Ajouter / Supprimer

### Convocations

| Colonne | Source |
|---------|--------|
| Date | `date` |
| Raison | `raison` |
| Avertissements | `nb_avertissements` (snapshot) |
| Effectuée | badge + bouton bascule |

**Actions** : Ajouter / Marquer effectuée / Supprimer
