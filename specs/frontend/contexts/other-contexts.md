# Autres contextes de domaine

Ce fichier regroupe les contextes dont le pattern est similaire mais qui méritent documentation.

---

## MatiereContext

**Fichier source :** `src/contexts/MatiereContext.tsx`

```typescript
interface MatiereContextType {
  create: (data: CreateMatiereDto) => Promise<Matiere | null>
  update: (id: string, data: Partial<Matiere>) => Promise<Matiere | null>
}
```

- `POST /matieres` — crée une matière
- `PATCH /matieres/:id` — met à jour
- Écoute : `matiere:created`, `matiere:updated` → `notifyDataChange('matieres')`

---

## NoteContext

**Fichier source :** `src/contexts/NoteContext.tsx`

```typescript
interface NoteContextType {
  create: (data: CreateNoteDto) => Promise<Note | null>
  update: (id: string, data: Partial<Note>) => Promise<Note | null>
  annuler: (id: string) => Promise<boolean>
  getBulletinFromApi: (eleveId: string, trimestre: number) => Promise<any>
  getMoyenneGenerale: (eleveId: string, trimestre: number) => Promise<number | null>
}
```

- `POST /notes` — crée une note
- `PATCH /notes/:id` — met à jour
- `PATCH /notes/:id/annuler` — annule une note
- Écoute : `note:created`, `note:updated` → `notifyDataChange('notes')`

---

## SalleContext

**Fichier source :** `src/contexts/SalleContext.tsx`

```typescript
interface SalleContextType {
  salles: Salle[]                         // état local mis à jour par socket
  getAll: () => Promise<void>
  getById: (id: string) => Promise<Salle | null>
  getDisponibles: (jour: string, heure_debut: string, heure_fin: string) => Promise<SalleDisponible[]>
  create: (data: CreateSalleDto) => Promise<Salle | null>
  update: (id: string, data: Partial<Salle>) => Promise<Salle | null>
  delete: (id: string) => Promise<boolean>
}
```

- Maintient un état local `salles[]` (rafraîchi par socket)
- `getDisponibles` → `GET /salles/disponibles?jour=...&heure_debut=...&heure_fin=...`
- Écoute : `salle:created`, `salle:updated`, `salle:deleted` → `notifyDataChange('salles')`

---

## AnneeContext

**Fichier source :** `src/contexts/AnneeContext.tsx`

```typescript
interface AnneeContextType {
  annees: AnneeScolaire[]
  anneeActive: AnneeScolaire | null
  anneePreparation: AnneeScolaire | null
  getAll: () => Promise<void>
  create: (data: CreateAnneeDto) => Promise<AnneeScolaire | null>
  update: (id: string, data: Partial<AnneeScolaire>) => Promise<AnneeScolaire | null>
  delete: (id: string) => Promise<boolean>
  demarrer: (id: string) => Promise<boolean>
  terminer: (id: string) => Promise<boolean>
}
```

- Maintient la liste des années et détecte l'année active/en préparation
- `POST /annees`, `PATCH /annees/:id`, `DELETE /annees/:id`
- `PATCH /annees/:id/demarrer` — active l'année (statut active)
- `PATCH /annees/:id/terminer` — termine l'année (statut terminee)
- Écoute : `annee:created`, `annee:updated`, `annee:deleted` → `notifyDataChange('annees')`

---

## NiveauContext

**Fichier source :** `src/contexts/NiveauContext.tsx`

```typescript
interface NiveauContextType {
  create: (data: CreateNiveauDto) => Promise<any>
  update: (id: string, data: any) => Promise<any>
  delete: (id: string) => Promise<boolean>
}
```

- `POST /niveaux`, `PATCH /niveaux/:id`, `DELETE /niveaux/:id`
- Écoute : `niveau:created`, `niveau:updated`, `niveau:deleted` → `notifyDataChange('niveaux')`

---

## ProfesseurContext

**Fichier source :** `src/contexts/ProfesseurContext.tsx`

```typescript
interface ProfesseurContextType {
  create: (data: CreateProfesseurDto) => Promise<Professeur | null>
  update: (id: string, data: Partial<Professeur>) => Promise<Professeur | null>
  desactiver: (id: string) => Promise<boolean>
  activer: (id: string) => Promise<boolean>
}
```

- `POST /professeurs`, `PATCH /professeurs/:id`
- `PATCH /professeurs/:id/desactiver` — passe statut inactif
- `PATCH /professeurs/:id/activer` — passe statut actif
- Écoute : `professeur:event` → `notifyDataChange('professeurs')`

---

## TeacherAssignmentContext

**Fichier source :** `src/contexts/TeacherAssignmentContext.tsx`

```typescript
interface TeacherAssignmentContextType {
  create: (data: CreateAssignmentDto) => Promise<TeacherAssignment | null>
  update: (id: string, data: Partial<TeacherAssignment>) => Promise<TeacherAssignment | null>
  delete: (id: string) => Promise<boolean>
  resolve: (classeId: string, matiereId: string) => Promise<TeacherAssignment | null>
}
```

- `POST /teacher-assignments`, `PATCH /teacher-assignments/:id`, `DELETE /teacher-assignments/:id`
- `resolve` : cherche l'affectation pour une classe + matière donnée
- Écoute : `assignment:event` → `notifyDataChange('professeurs')`

---

## PeriodeContext

**Fichier source :** `src/contexts/PeriodeContext.tsx`

```typescript
interface PeriodeContextType {
  updatePeriode: (id: string, data: Partial<PeriodeEvaluation>) => Promise<PeriodeEvaluation | null>
  terminerPeriode: (id: string) => Promise<boolean>
}
```

- `PATCH /periodes/:id` — met à jour dates/trimestre
- `PATCH /periodes/:id/terminer` — clôture la période
- Écoute : `periode:updated` → `notifyDataChange('periodes')`

---

## EvaluationContext

**Fichier source :** `src/contexts/EvaluationContext.tsx`

```typescript
interface NoteEvaluation {
  eleve_id: string
  valeur: number | null
  absent: boolean
}

interface EvaluationContextType {
  create: (data: CreateEvaluationDto) => Promise<any>
  saisirNotes: (id: string, notes: NoteEvaluation[]) => Promise<boolean>
  publier: (id: string) => Promise<boolean>
  deleteEvaluation: (id: string) => Promise<boolean>
}
```

- `POST /evaluations` — crée l'évaluation (brouillon)
- `PATCH /evaluations/:id/notes` — saisit ou met à jour la liste des notes
- `PATCH /evaluations/:id/publier` — publie l'évaluation (génère les `Note` dans la collection notes)
- `DELETE /evaluations/:id` — supprime
- Écoute : `evaluation:created`, `evaluation:updated`, `evaluation:publie`, `evaluation:deleted` → `notifyDataChange('evaluations')`
