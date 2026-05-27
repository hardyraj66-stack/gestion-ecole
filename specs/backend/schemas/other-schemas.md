# Schémas Mongoose — Autres entités

---

## Matiere

**Fichier :** `server/src/matieres/matiere.schema.ts`
**Collection :** `matieres`

```typescript
@Schema({ timestamps: true })
class Matiere {
  nom: string                 // ex: "Mathématiques"
  code: string                // ex: "MATH" (unique conseillé)
  coefficient?: number        // legacy — utiliser coefficients[]
  coefficients: Array<{
    niveau: string
    coefficient: number
  }>
  description?: string
  couleur?: string            // hex, ex: "#3B82F6"
  actif: boolean              // défaut: true
}
```

Index : `{ actif: 1 }`

---

## Note

**Fichier :** `server/src/notes/note.schema.ts`
**Collection :** `notes`

```typescript
@Schema({ timestamps: true })
class Note {
  eleve_id: string            // ref Eleve
  matiere_id: string          // ref Matiere
  valeur: number              // 0-20
  trimestre: 1 | 2 | 3
  type?: 'ds' | 'evaluation'  // null si saisie directe (legacy)
  date: Date
  commentaire?: string
  annulee: boolean            // défaut: false
  annee_scolaire: string      // ex: "2024-2025"
}
```

Index :
```javascript
{ eleve_id: 1, trimestre: 1, annulee: 1 }
{ matiere_id: 1 }
{ annee_scolaire: 1 }
```

---

## Creneau (Planning)

**Fichier :** `server/src/planning/creneau.schema.ts`
**Collection :** `creneaux`

```typescript
@Schema({ timestamps: true })
class Creneau {
  classe_id: string
  matiere_id: string
  matiere_nom: string         // dénormalisé pour l'affichage
  matiere_couleur: string     // dénormalisé pour l'affichage
  jour: 'Lundi'|'Mardi'|'Mercredi'|'Jeudi'|'Vendredi'|'Samedi'
  heure_debut: string         // "08:00"
  heure_fin: string           // "10:00"
  salle: string               // nom de la salle
  professeur_id?: string      // ref Professeur (optionnel)
}
```

Index :
```javascript
{ classe_id: 1 }
{ salle: 1, jour: 1 }
{ matiere_id: 1 }
```

---

## Salle

**Fichier :** `server/src/salles/salle.schema.ts`
**Collection :** `salles`

```typescript
@Schema({ timestamps: true })
class Salle {
  nom: string
  capacite: number
  description: string         // défaut: ''
  type: 'standard'|'laboratoire'|'informatique'|'sport'|'arts'|'amphi'|'autre'
  equipements: string[]       // valeurs Equipement enum
  accessible_pmr: boolean     // défaut: false
  batiment: string            // défaut: ''
  etage: string               // défaut: ''
  actif: boolean              // défaut: true
}
```

---

## Professeur

**Fichier :** `server/src/professeurs/professeur.schema.ts`
**Collection :** `professeurs`

```typescript
@Schema({ timestamps: true })
class Professeur {
  nom: string
  prenom: string
  email: string               // unique
  telephone: string
  genre: 'M' | 'F'
  statut: 'actif' | 'inactif'  // défaut: 'actif'
}
```

Index : `{ statut: 1 }`, `{ nom: 1 }`

---

## AnneeScolaire

**Fichier :** `server/src/annees/annee.schema.ts`
**Collection :** `anneescolaires`

```typescript
@Schema({ timestamps: true })
class AnneeScolaire {
  label: string               // unique, ex: "2024-2025"
  debut: Date
  fin: Date
  statut: 'active'|'terminee'|'preparation'
  historique: Array<{
    action: string
    date: Date
    details: string
  }>
}
```

Index : `{ statut: 1 }`
Contrainte : une seule année `active` à la fois (enforced dans le service)

---

## Niveau

**Fichier :** `server/src/niveaux/niveau.schema.ts`
**Collection :** `niveaux`

```typescript
@Schema({ timestamps: true })
class Niveau {
  nom: string                 // unique, ex: "6ème"
  ordre: number               // pour le tri (1, 2, 3...)
  description?: string
  matiere_ids: string[]       // matières associées à ce niveau
}
```

Index : `{ ordre: 1, nom: 1 }` (unique composé)

---

## PeriodeEvaluation

**Fichier :** `server/src/periodes/periode.schema.ts`
**Collection :** `periodeevaluations`

```typescript
@Schema({ timestamps: true })
class PeriodeEvaluation {
  trimestre: 1 | 2 | 3
  type: 'ds' | 'evaluation'
  annee_scolaire: string
  date_debut: Date | null
  date_fin: Date | null
  terminee: boolean           // défaut: false
}
```

Index unique : `{ trimestre: 1, type: 1, annee_scolaire: 1 }`
→ 6 périodes max par année (3 trimestres × 2 types)

---

## Evaluation

**Fichier :** `server/src/evaluations/evaluation.schema.ts`
**Collection :** `evaluations`

```typescript
@Schema()
class NoteEvaluation {
  eleve_id: string
  valeur: number | null       // null si absent
  absent: boolean             // défaut: false
}

@Schema({ timestamps: true })
class Evaluation {
  type: 'ds' | 'evaluation'
  classe_id: string
  matiere_id: string
  trimestre: 1 | 2 | 3
  annee_scolaire: string
  date: Date
  statut: 'brouillon' | 'publie'   // défaut: 'brouillon'
  notes: NoteEvaluation[]
}
```

Index unique : `{ classe_id: 1, matiere_id: 1, trimestre: 1, type: 1 }`
→ une seule évaluation par (classe, matière, trimestre, type)

---

## TeacherAssignment

**Fichier :** `server/src/teacher-assignments/teacher-assignment.schema.ts`
**Collection :** `teacherassignments`

```typescript
@Schema({ timestamps: true })
class TeacherAssignment {
  professeur_id: string
  classe_id: string
  matiere_id: string
}
```

Index unique : `{ classe_id: 1, matiere_id: 1 }`
→ un seul prof par (classe, matière)

---

## Absence

**Fichier :** `server/src/suivi/absence.schema.ts`
**Collection :** `absences`

```typescript
@Schema({ timestamps: true })
class Absence {
  eleve_id: string
  date: Date
  motif?: string
  type: 'absence' | 'retard'
  duree?: string
  justifiee: boolean     // défaut: false
  annee_scolaire: string
}
```

Index : `{ eleve_id: 1 }`, `{ eleve_id: 1, annee_scolaire: 1 }`

---

## Avertissement

**Fichier :** `server/src/suivi/avertissement.schema.ts`
**Collection :** `avertissements`

```typescript
@Schema({ timestamps: true })
class Avertissement {
  eleve_id: string
  motif: string
  annee_scolaire: string
  date: Date
  commentaire?: string
  type: 'comportement' | 'degats' | 'absence' | 'autre'
}
```

---

## Convocation

**Fichier :** `server/src/suivi/convocation.schema.ts`
**Collection :** `convocations`

```typescript
@Schema({ timestamps: true })
class Convocation {
  eleve_id: string
  date: Date
  raison: string
  commentaire?: string
  effectuee: boolean          // défaut: false
  nb_avertissements: number   // nb d'avertissements au moment de la convocation
  annee_scolaire: string
}
```

---

## EleveExclu (Exclusion)

**Fichier :** `server/src/exclusions/exclusion.schema.ts`
**Collection :** `exclusions`

```typescript
@Schema({ timestamps: true })
class EleveExclu {
  eleve_id: string
  nom: string; prenom: string
  classe_id: string; classe_nom: string
  date_exclusion: Date
  raison: string
  commentaire?: string
  nb_avertissements_au_moment: number
  annee_scolaire: string
}
```

---

## EleveQuitte (Depart)

**Fichier :** `server/src/departs/depart.schema.ts`
**Collection :** `departs`

```typescript
@Schema({ timestamps: true })
class EleveQuitte {
  eleve_id: string
  nom: string; prenom: string
  classe_id: string; classe_nom: string
  date_depart: Date
  raison: string
  commentaire?: string
  motif: 'changement_ecole'|'demenagement'|'raison_familiale'|'autre'
  annee_scolaire: string
}
```

---

## PlanningExecution

**Fichier :** `server/src/planning-executions/planning-execution.schema.ts`
**Collection :** `planningexecutions`

```typescript
@Schema({ timestamps: true })
class PlanningExecution {
  creneau_id: string
  annee_id: string
  classe_id: string
  matiere_id: string
  professeur_id: string
  prof_remplacant_id?: string
  date: Date
  heure_debut: string; heure_fin: string
  salle: string
  statut: 'planifie'|'effectue'|'annule'|'remplacement'
  motif_annulation?: string
}
```

Index : `{ classe_id: 1, date: 1 }`, `{ professeur_id: 1, date: 1 }`
