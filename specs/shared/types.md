# Types TypeScript partagés

**Fichier source :** `src/types/index.ts`

Tous les types de domaine utilisés par le frontend. Le backend utilise des interfaces Mongoose équivalentes dans ses schémas.

---

## Types primitifs / Unions

```typescript
type SalleType = 'fixe' | 'variable'
// fixe  → salle permanente de la classe
// variable → salle choisie par créneau

type EleveStatut = 'actif' | 'exclu' | 'parti'

type Trimestre = 1 | 2 | 3

type PeriodeType = 'ds' | 'evaluation'

type JourSemaine = 'Lundi' | 'Mardi' | 'Mercredi' | 'Jeudi' | 'Vendredi' | 'Samedi'

type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'default' | 'primary'

type AnneeStatut = 'active' | 'terminee' | 'preparation'

type TypeSalle = 'standard' | 'laboratoire' | 'informatique' | 'sport' | 'arts' | 'amphi' | 'autre'

type Equipement = 'projecteur' | 'ordinateurs' | 'tableau_interactif' | 'labo_scientifique' | 'sono' | 'climatisation'
```

---

## Entités principales

### Classe
```typescript
interface Classe {
  id: string
  nom: string              // ex: "6ème A"
  niveau: string           // ex: "6ème"
  annee_scolaire: string   // ex: "2024-2025"
  capacite: number
  salle: string            // nom de la salle (vide si salle_type=variable)
  salle_type: SalleType    // 'fixe' | 'variable'
  actif?: boolean
}
```

### Eleve
```typescript
interface ParentInfo {
  nom: string
  prenom: string
  telephone?: string
  email?: string
  statut: 'vivant' | 'decede'
}

interface TuteurInfo {
  nom: string
  prenom: string
  telephone?: string
  email?: string
  lien?: string            // lien de parenté (ex: "oncle")
}

interface Eleve {
  id: string
  nom: string
  prenom: string
  date_naissance: string   // ISO date
  genre: 'M' | 'F'
  classe_id: string
  email?: string
  telephone?: string
  adresse?: string
  pere?: ParentInfo | null
  mere?: ParentInfo | null
  tuteur?: TuteurInfo | null
  statut: EleveStatut      // 'actif' | 'exclu' | 'parti'
}
```

### Matiere
```typescript
interface CoefficientNiveau {
  niveau: string           // ex: "6ème"
  coefficient: number
}

interface Matiere {
  id: string
  nom: string              // ex: "Mathématiques"
  code: string             // ex: "MATH"
  coefficient?: number     // legacy, fallback si coefficients[] absent
  coefficients?: CoefficientNiveau[]  // coefficients par niveau (préféré)
  description?: string
  couleur?: string         // couleur hex pour le planning
}
```

### Note
```typescript
interface Note {
  id: string
  eleve_id: string
  matiere_id: string
  valeur: number           // 0–20
  trimestre: Trimestre     // 1 | 2 | 3
  date: string             // ISO date
  commentaire?: string
}

interface BulletinMatiere {
  matiere_id: string
  matiere_nom: string
  code: string
  coefficient: number
  ds: number | null        // note DS (peut être null si non saisi)
  evaluation: number | null
  moyenne: number          // moyenne calculée (ds + eval / 2)
}
```

### Creneau (Planning)
```typescript
interface Creneau {
  id: string
  classe_id: string
  matiere_id: string
  matiere_nom: string
  matiere_couleur: string
  jour: JourSemaine
  heure_debut: string      // "08:00"
  heure_fin: string        // "10:00"
  salle: string
  professeur_id: string
  professeur_nom: string
}
```

### Professeur
```typescript
interface Professeur {
  id: string
  nom: string
  prenom: string
  email: string
  telephone: string
  genre: 'M' | 'F'
  statut: 'actif' | 'inactif'
}

interface TeacherAssignment {
  id: string
  professeur_id: string
  classe_id: string
  matiere_id: string
  professeur_nom?: string
}
```

### Salle
```typescript
interface Salle {
  id: string
  nom: string
  capacite: number
  description: string
  type: TypeSalle
  equipements: Equipement[]
  accessible_pmr: boolean
  batiment: string
  etage: string
}

interface SalleDisponible extends Salle {
  disponible: boolean
  occupant: {
    classe_id: string
    classe_nom: string
    matiere_nom: string
    heure_debut: string
    heure_fin: string
  } | null
}

interface SalleStats {
  creneaux_par_semaine: number
  jours_utilises: number
  heures_par_semaine: number
  taux_occupation: number
}
```

### AnneeScolaire
```typescript
interface AnneeHistorique {
  action: string
  date: string
  details: string
}

interface AnneeScolaire {
  id: string
  label: string            // ex: "2024-2025"
  debut: string            // ISO date
  fin: string              // ISO date
  statut: AnneeStatut      // 'active' | 'terminee' | 'preparation'
  historique: AnneeHistorique[]
}
```

### PeriodeEvaluation
```typescript
interface PeriodeEvaluation {
  id: string
  trimestre: Trimestre
  type: PeriodeType        // 'ds' | 'evaluation'
  annee_scolaire: string
  date_debut: string | null
  date_fin: string | null
}
```

---

## Entités de suivi élève

### Avertissement
```typescript
interface Avertissement {
  id: string
  eleve_id: string
  motif: string
  annee_scolaire: string
  date: string
  commentaire?: string
  type: 'comportement' | 'degats' | 'absence' | 'autre'
}
```

### Convocation
```typescript
interface Convocation {
  id: string
  eleve_id: string
  date: string
  raison: string
  commentaire?: string
  effectuee: boolean
  nb_avertissements: number
}
```

### Absence
```typescript
interface Absence {
  id: string
  eleve_id: string
  date: string
  motif?: string
  type: 'absence' | 'retard'
  duree?: string
  justifiee?: boolean
}
```

### EleveExclu
```typescript
interface EleveExclu {
  id: string
  eleve_id: string
  nom: string
  prenom: string
  classe_id: string
  classe_nom: string
  date_exclusion: string
  raison: string
  commentaire?: string
  nb_avertissements_au_moment: number
  annee_scolaire: string
}
```

### EleveQuitte
```typescript
interface EleveQuitte {
  id: string
  eleve_id: string
  nom: string
  prenom: string
  classe_id: string
  classe_nom: string
  date_depart: string
  raison: string
  commentaire?: string
  motif: 'changement_ecole' | 'demenagement' | 'raison_familiale' | 'autre'
  annee_scolaire: string
}
```

---

## Constantes exportées

```typescript
const TYPES_SALLE: { value: TypeSalle; label: string }[] = [
  { value: 'standard',    label: 'Salle de classe' },
  { value: 'laboratoire', label: 'Laboratoire' },
  { value: 'informatique',label: 'Salle informatique' },
  { value: 'sport',       label: 'Salle de sport' },
  { value: 'arts',        label: 'Salle arts' },
  { value: 'amphi',       label: 'Amphi' },
  { value: 'autre',       label: 'Autre' },
]

const EQUIPEMENTS_SALLE: { value: Equipement; label: string }[] = [
  { value: 'projecteur',         label: 'Projecteur' },
  { value: 'ordinateurs',        label: 'Ordinateurs' },
  { value: 'tableau_interactif', label: 'Tableau interactif' },
  { value: 'labo_scientifique',  label: 'Labo scientifique' },
  { value: 'sono',               label: 'Sono / Ampli' },
  { value: 'climatisation',      label: 'Climatisation' },
]
```
