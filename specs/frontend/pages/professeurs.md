# Pages Professeurs

**Routes :** `/professeurs`, `/professeurs/:id`, `/professeurs/affectations`
**Dossier :** `src/pages/Professeurs/`

---

## Page ProfesseursList

**Route :** `/professeurs`
**Fichier :** `ProfesseursList.tsx`

### Rôle
Liste des professeurs avec recherche, pagination, et accès à la fiche détail.

### Données requises

```typescript
// Hook: useProfesseursListData(page, search)
// Endpoint: GET /read/professeurs?page=N&limit=20&search=...

interface ProfesseursListData {
  items: Professeur[]
  total: number; page: number; pages: number
}
```

### Structure UI

```
PageHeader "Professeurs"
  └─ Bouton "Nouveau professeur"

SearchInput

Table professeurs:
  Colonnes: Nom, Prénom, Email, Téléphone, Genre, Statut, Actions
  Actions: "Fiche" → /professeurs/:id

Pagination
```

### Création de professeur
- Bouton "Nouveau professeur" → modal inline (pas de page séparée)
- Champs : nom, prénom, email, téléphone, genre
- Soumission : `ProfesseurContext.create(data)` → `POST /professeurs`

---

## Page ProfesseurDetail

**Route :** `/professeurs/:id`
**Fichier :** `ProfesseurDetail.tsx`

### Rôle
Fiche complète d'un professeur : informations personnelles, classes et matières enseignées.

### Données requises

```typescript
// Hook: useProfesseurDetailData(id)
// Endpoint: GET /read/professeurs/:id

interface ProfesseurDetailData {
  professeur: Professeur
  assignments: Array<{
    id: string
    classe_id: string; classe_nom: string; classe_niveau: string
    matiere_id: string; matiere_nom: string; matiere_code: string
  }>
  nb_eleves: number   // total élèves dans ses classes
}
```

### Structure UI

```
PageHeader "[Prénom Nom]"
  ├─ Badge statut (actif/inactif)
  └─ Boutons: Modifier, Désactiver/Activer

Carte infos: email, téléphone, genre

Section "Affectations"
  ├─ Liste classe + matière enseignée
  └─ Bouton "Gérer les affectations" → /professeurs/affectations
```

### Actions
- Modifier → modal édition
- Désactiver → `ProfesseurContext.desactiver(id)` → `PATCH /professeurs/:id/desactiver`
- Activer (si inactif) → `ProfesseurContext.activer(id)`

---

## Page ProfesseurAssignments

**Route :** `/professeurs/affectations`
**Fichier :** `ProfesseurAssignments.tsx`

### Rôle
Interface de gestion des affectations : quel professeur enseigne quelle matière dans quelle classe.

### Données requises

```typescript
// Chargement via readApi.professeursActifs() + readApi.classesList() + readApi.matieresList()
interface AssignmentsPageData {
  professeurs: Professeur[]
  classes: Classe[]
  matieres: Matiere[]
  assignments: TeacherAssignment[]
}
```

### Structure UI

```
PageHeader "Affectations professeurs"

Grille classe × matière
  Chaque cellule: select du professeur affecté (ou vide)

Bouton "Enregistrer les affectations"
```

### Logique
- Affiche une matrice classes × matières
- Pour chaque case, sélection d'un professeur
- Création : `TeacherAssignmentContext.create({ classe_id, matiere_id, professeur_id })`
- Modification : `TeacherAssignmentContext.update(id, { professeur_id })`
- Suppression (si vide) : `TeacherAssignmentContext.delete(id)`

---

## Dépendances communes

- `src/hooks/usePageData.ts` → `useProfesseursListData`, `useProfesseurDetailData`
- `src/contexts/ProfesseurContext.tsx`
- `src/contexts/TeacherAssignmentContext.tsx`
- `src/components/shared/Table.tsx`
- `src/components/shared/Modal.tsx`
