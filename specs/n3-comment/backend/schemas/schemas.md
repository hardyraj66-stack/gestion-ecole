# Schémas MongoDB

> **Couche** : N3 — COMMENT (schémas)
> **Ce fichier contient** : tous les schémas Mongoose avec champs, types, contraintes et index
> **Ce fichier NE contient PAS** : détails métier (→ N2a), détails écrans (→ N2b)

---

## Collection `classes`

| Champ | Type | Requis | Défaut | Enum / Contrainte |
|-------|------|--------|--------|------------------|
| `nom` | String | oui | — | — |
| `niveau` | String | oui | — | — |
| `annee_scolaire` | String | oui | — | label de l'année active |
| `capacite` | Number | oui | 30 | — |
| `salle` | String | non | `''` | — |
| `salle_type` | String | oui | `'fixe'` | `'fixe'` \| `'variable'` |
| `actif` | Boolean | non | `true` | — |

**Index** : `{ annee_scolaire: 1 }`, `{ annee_scolaire: 1, actif: 1 }`, `{ salle: 1, salle_type: 1, actif: 1 }`, `{ niveau: 1, actif: 1 }`

---

## Collection `eleves`

| Champ | Type | Requis | Défaut |
|-------|------|--------|--------|
| `nom` | String | oui | — |
| `prenom` | String | oui | — |
| `date_naissance` | String | oui | — |
| `genre` | String | oui | — | `'M'` \| `'F'` |
| `classe_id` | String | oui | — |
| `email` | String | non | — |
| `telephone` | String | non | — |
| `adresse` | String | non | — |
| `pere` | Object | non | `null` | `{ nom, prenom, telephone, email, statut: 'vivant'\|'decede' }` |
| `mere` | Object | non | `null` | idem |
| `tuteur` | Object | non | `null` | `{ nom, prenom, telephone, email, lien }` |
| `statut` | String | oui | `'actif'` | `'actif'` \| `'exclu'` \| `'parti'` |
| `historique_classes` | Array | non | `[]` | `[{ annee_scolaire, classe_id, classe_nom, niveau, statut }]` |

**Index** : `{ classe_id: 1 }`, `{ 'historique_classes.annee_scolaire': 1 }`

---

## Collection `notes`

| Champ | Type | Requis | Défaut |
|-------|------|--------|--------|
| `eleve_id` | String | oui | — |
| `matiere_id` | String | oui | — |
| `valeur` | Number | oui | — |
| `trimestre` | Number | oui | 1 | `1` \| `2` \| `3` |
| `type` | String | non | `null` | `'ds'` \| `'evaluation'` |
| `date` | String | oui | — |
| `commentaire` | String | non | — |
| `annulee` | Boolean | non | `false` |
| `annee_scolaire` | String | non | `''` |

**Index** : `{ eleve_id: 1, trimestre: 1, annulee: 1 }`, `{ matiere_id: 1 }`, `{ annee_scolaire: 1 }`

---

## Collection `creneaux`

| Champ | Type | Requis | Défaut |
|-------|------|--------|--------|
| `classe_id` | String | oui | — |
| `matiere_id` | String | oui | — |
| `matiere_nom` | String | oui | — |
| `matiere_couleur` | String | non | `'#2563eb'` |
| `jour` | String | oui | — | `'Lundi'`…`'Samedi'` |
| `heure_debut` | String | oui | — | ex: `"08:00"` |
| `heure_fin` | String | oui | — | ex: `"09:00"` |
| `salle` | String | oui | — |

**Index** : `{ classe_id: 1 }`, `{ salle: 1, jour: 1 }`, `{ matiere_id: 1 }`

---

## Collection `salles`

| Champ | Type | Requis | Défaut |
|-------|------|--------|--------|
| `nom` | String | oui | — |
| `capacite` | Number | oui | 30 |
| `description` | String | non | `''` |
| `type` | String | oui | `'standard'` | `'standard'\|'laboratoire'\|'informatique'\|'sport'\|'arts'\|'amphi'\|'autre'` |
| `equipements` | String[] | non | `[]` | `'projecteur'\|'ordinateurs'\|'tableau_interactif'\|'labo_scientifique'\|'sono'\|'climatisation'` |
| `accessible_pmr` | Boolean | non | `false` |
| `batiment` | String | non | `''` |
| `etage` | String | non | `''` |
| `actif` | Boolean | non | `true` |

---

## Collection `matieres`

| Champ | Type | Requis | Défaut |
|-------|------|--------|--------|
| `nom` | String | oui | — |
| `code` | String | oui | — |
| `coefficient` | Number | non | 1 |
| `coefficients` | Array | non | `[]` | `[{ niveau: string, coefficient: number }]` |
| `description` | String | non | — |
| `couleur` | String | non | — |
| `actif` | Boolean | non | `true` |

**Index** : `{ actif: 1 }`

---

## Collection `niveaux`

| Champ | Type | Requis | Défaut |
|-------|------|--------|--------|
| `nom` | String | oui — unique | — |
| `ordre` | Number | oui | 0 |
| `description` | String | non | `''` |
| `matiere_ids` | String[] | non | `[]` |

**Index** : `{ ordre: 1, nom: 1 }`

---

## Collection `professeurs`

| Champ | Type | Requis | Défaut |
|-------|------|--------|--------|
| `nom` | String | oui | — |
| `prenom` | String | oui | — |
| `email` | String | non | `''` |
| `telephone` | String | non | `''` |
| `genre` | String | oui | — | `'M'` \| `'F'` |
| `statut` | String | non | `'actif'` | `'actif'` \| `'inactif'` |

**Index** : `{ statut: 1 }`, `{ nom: 1 }`

---

## Collection `anneescolaires`

| Champ | Type | Requis | Défaut |
|-------|------|--------|--------|
| `label` | String | oui — unique | — |
| `debut` | String | oui | — |
| `fin` | String | oui | — |
| `statut` | String | oui | `'preparation'` | `'active'\|'terminee'\|'preparation'` |
| `historique` | Array | non | `[]` | `[{ action, date, details }]` |

**Index** : `{ statut: 1 }`

---

## Collection `evaluations`

| Champ | Type | Requis | Défaut |
|-------|------|--------|--------|
| `type` | String | oui | — | `'ds'` \| `'evaluation'` |
| `classe_id` | String | oui | — |
| `matiere_id` | String | oui | — |
| `trimestre` | Number | oui | — | `1` \| `2` \| `3` |
| `annee_scolaire` | String | oui | — |
| `date` | String | oui | — |
| `statut` | String | oui | `'brouillon'` | `'brouillon'` \| `'publie'` |
| `notes` | Array | non | `[]` | `[{ eleve_id, valeur: number\|null, absent: boolean }]` |

**Index** : `{ classe_id, matiere_id, trimestre, type }` — unique

---

## Collection `absences`

| Champ | Type | Requis | Défaut |
|-------|------|--------|--------|
| `eleve_id` | String | oui | — |
| `date` | String | oui | — |
| `motif` | String | non | `''` |
| `type` | String | oui | `'absence'` | `'absence'` \| `'retard'` |
| `duree` | String | non | `''` |
| `justifiee` | Boolean | non | `false` |
| `annee_scolaire` | String | non | `''` |

**Index** : `{ eleve_id: 1, type: 1 }`, `{ eleve_id: 1, annee_scolaire: 1 }`

---

## Collection `avertissements`

| Champ | Type | Requis | Défaut |
|-------|------|--------|--------|
| `eleve_id` | String | oui | — |
| `motif` | String | oui | — |
| `annee_scolaire` | String | oui | — |
| `date` | String | oui | — |
| `commentaire` | String | non | `''` |
| `type` | String | oui | `'comportement'` | `'comportement'\|'degats'\|'absence'\|'autre'` |

**Index** : `{ eleve_id: 1 }`, `{ eleve_id: 1, annee_scolaire: 1 }`

---

## Collection `convocations`

| Champ | Type | Requis | Défaut |
|-------|------|--------|--------|
| `eleve_id` | String | oui | — |
| `date` | String | oui | — |
| `raison` | String | oui | — |
| `commentaire` | String | non | `''` |
| `effectuee` | Boolean | non | `false` |
| `nb_avertissements` | Number | non | 0 |
| `annee_scolaire` | String | non | `''` |

**Index** : `{ eleve_id: 1 }`, `{ eleve_id: 1, annee_scolaire: 1 }`

---

## Collection `periodeevaluations`

| Champ | Type | Requis | Défaut |
|-------|------|--------|--------|
| `trimestre` | Number | oui | — | `1` \| `2` \| `3` |
| `type` | String | oui | — | `'ds'` \| `'evaluation'` |
| `annee_scolaire` | String | oui | — |
| `date_debut` | String | non | `null` |
| `date_fin` | String | non | `null` |
| `terminee` | Boolean | non | `false` |

**Index** : `{ trimestre, type, annee_scolaire }` — unique

---

## Collections vues dénormalisées (read-*)

Maintenues par `ViewBuilderService`. Même structure que les collections sources mais enrichies de données jointes (ex: `read-eleves` contient `classe_nom`, `niveau`).

| Collection | Alimentée par |
|------------|--------------|
| `read-classes` | `onClasseWrite` |
| `read-eleves` | `onEleveWrite` |
| `read-matieres` | `onMatiereWrite` |
| `read-notes` | `onNoteWrite` |
| `read-creneaux` | `onCreneauWrite` |
| `read-salles` | `onSalleWrite` |
| `read-evaluations` | `onEvaluationWrite` |
