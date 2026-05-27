# Pages Évaluations

**Routes :** `/evaluations`, `/evaluations/liste`, `/evaluations/nouvelle`, `/evaluations/:id`
**Dossier :** `src/pages/evaluations/`

---

## Page PeriodesList

**Route :** `/evaluations`
**Fichier :** `PeriodesList.tsx`

### Rôle
Vue d'ensemble des périodes d'évaluation (DS et Évaluations) pour l'année active, organisées par trimestre. Permet de configurer les dates des périodes.

### Données requises

```typescript
// Hook: usePeriodesData(annee_active)
// Endpoint: GET /read/periodes?annee_scolaire=XXXX-XXXX

interface PeriodesData {
  periodes: PeriodeEvaluation[]   // 6 périodes : 3 trimestres × (DS + Évaluation)
  annee_scolaire: string
}
```

### Structure UI

```
PageHeader "Périodes d'évaluation"
  └─ Tabs: "Périodes" | "Évaluations" (→ /evaluations/liste)

3 sections (une par trimestre):
  Trimestre N:
    ├─ Période DS
    │   ├─ Dates début/fin (éditables)
    │   ├─ Statut (ouverte/terminée)
    │   └─ Bouton "Terminer" si ouverte
    └─ Période Évaluation
        ├─ Dates début/fin (éditables)
        └─ Bouton "Terminer"
```

### Interactions
- Modifier dates : `PeriodeContext.updatePeriode(id, { date_debut, date_fin })`
- Terminer : `PeriodeContext.terminerPeriode(id)` → `PATCH /periodes/:id/terminer`

---

## Page EvaluationsList

**Route :** `/evaluations/liste`
**Fichier :** `EvaluationsList.tsx`

### Rôle
Liste toutes les évaluations (DS et contrôles) avec filtres par classe, matière, trimestre, statut.

### Données requises

```typescript
// Hook: useEvaluationsListData(classeId, matiereId, trimestre, statut, page, anneeLabel)
// Endpoint: GET /read/evaluations?...

interface EvaluationsListData {
  items: Array<{
    id: string; type: PeriodeType; classe_nom: string
    matiere_nom: string; trimestre: Trimestre
    date: string; statut: 'brouillon' | 'publie'
    nb_notes: number; nb_absents: number
  }>
  total: number; page: number; pages: number
  // Données pour les filtres:
  classes: Array<{ id: string; nom: string }>
  matieres: Array<{ id: string; nom: string }>
}
```

### Structure UI

```
PageHeader "Évaluations"
  └─ Bouton "Nouvelle évaluation" → /evaluations/nouvelle

FilterBar
  ├─ Select classe
  ├─ Select matière
  ├─ Select trimestre
  └─ Select statut (brouillon/publié)

Table évaluations:
  Colonnes: Type, Classe, Matière, Trimestre, Date, Statut, Notes saisies, Actions
  Actions: "Voir" → /evaluations/:id

Pagination
```

---

## Page CreateEvaluation

**Route :** `/evaluations/nouvelle`
**Fichier :** `CreateEvaluation.tsx`

### Champs du formulaire

| Champ | Type | Obligatoire |
|-------|------|-------------|
| `type` | select (ds/evaluation) | oui |
| `classe_id` | select | oui |
| `matiere_id` | select | oui |
| `trimestre` | select (1/2/3) | oui |
| `date` | date | oui |

### Soumission
```typescript
// EvaluationContext.create(data) → POST /evaluations
// Crée en statut 'brouillon'
// Redirige vers /evaluations/:id pour la saisie des notes
```

---

## Page EvaluationDetail

**Route :** `/evaluations/:id`
**Fichier :** `EvaluationDetail.tsx`

### Rôle
Interface de saisie des notes pour une évaluation. Affiche la liste des élèves de la classe avec un champ note et une case "absent" par élève. Permet de publier l'évaluation.

### Données requises

```typescript
// Hook: useEvaluationDetailData(id)
// Endpoint: GET /read/evaluations/:id

interface EvaluationDetailData {
  evaluation: {
    id: string; type: PeriodeType; classe_id: string; classe_nom: string
    matiere_id: string; matiere_nom: string; trimestre: Trimestre
    date: string; statut: 'brouillon' | 'publie'; annee_scolaire: string
  }
  notes: Array<{
    eleve_id: string; nom: string; prenom: string
    valeur: number | null; absent: boolean
  }>
}
```

### Structure UI

```
PageHeader "[Type] — [Matière] — [Classe] — Trimestre N"
  └─ Badge statut (brouillon/publié)

NotesGrid (composant src/components/evaluations/NotesGrid.tsx)
  ├─ Colonnes: Nom, Prénom, Note (0-20), Absent (checkbox)
  └─ Une ligne par élève

Barre d'actions:
  ├─ Bouton "Enregistrer les notes" (brouillon uniquement)
  └─ Bouton "Publier" (brouillon → publie, génère les Note dans la collection notes)

[Si statut publié:]
  └─ Mode lecture seule + Statistiques (moyenne, min, max, nb absents)
```

### NotesGrid (composant réutilisable)

```typescript
// src/components/evaluations/NotesGrid.tsx
interface NotesGridProps {
  notes: Array<{ eleve_id: string; nom: string; prenom: string; valeur: number | null; absent: boolean }>
  onChange: (notes: NoteEvaluation[]) => void
  readOnly?: boolean
}
```

### Interactions
- Enregistrer : `EvaluationContext.saisirNotes(id, notes)` → `PATCH /evaluations/:id/notes`
- Publier : `EvaluationContext.publier(id)` → `PATCH /evaluations/:id/publier`
  - Génère automatiquement les entrées dans la collection `notes`
- Supprimer (brouillon uniquement) : `EvaluationContext.deleteEvaluation(id)` avec ConfirmDialog

---

## Dépendances

- `src/hooks/useEvaluationData.ts`
- `src/hooks/usePeriodesData.ts`
- `src/contexts/EvaluationContext.tsx`
- `src/contexts/PeriodeContext.tsx`
- `src/components/evaluations/NotesGrid.tsx`
- `src/components/shared/Table.tsx`
- `src/components/shared/Modal.tsx`
