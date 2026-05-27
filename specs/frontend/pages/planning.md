# Page Planning

**Routes :** `/planning` (global) et `/classes/:id/planning` (classe spécifique)
**Dossier :** `src/pages/Planning/`
**Fichier principal :** `Planning.tsx`

---

## Rôle

Éditeur visuel du planning hebdomadaire. Affiche une grille heure × jour avec les créneaux de cours. Permet la création, modification, et suppression de créneaux via drag-and-drop et modales.

---

## Composants du dossier

| Fichier | Rôle |
|---------|------|
| `Planning.tsx` | Page principale, sélecteur de classe, état global |
| `PlanningGrid.tsx` | Grille visuelle heure × jour |
| `PlanningModals.tsx` | Modales création / édition / suppression créneau |
| `PlanningOverlays.tsx` | Indicateurs visuels (conflits, survol, drag) |
| `SalleSelect.tsx` | Sélecteur de salle disponible pour un créneau |
| `planning.helpers.ts` | Fonctions utilitaires (positionnement, chevauchement) |
| `planning.types.ts` | Types locaux à la page Planning |
| `usePlanningDnd.ts` | Hook drag-and-drop (déplacement de créneaux) |
| `usePlanningState.ts` | Hook état local de la grille |

---

## Types locaux (`planning.types.ts`)

```typescript
interface PlanningCell {
  jour: JourSemaine
  heure: string          // "08:00"
}

interface DragState {
  creneau: Creneau
  sourceCell: PlanningCell
}

interface ConflitInfo {
  type: 'salle' | 'classe' | 'professeur'
  message: string
}
```

---

## Données requises

### Liste des classes (sélecteur)
```typescript
// Hook: usePlanningClasses()
// Endpoint: GET /read/planning/classes
interface PlanningClassesData {
  classes: Array<{ id: string; nom: string; niveau: string }>
  niveaux: string[]
}
```

### Créneaux d'une classe
```typescript
// Hook: usePlanningClasse(classeId)
// Endpoint: GET /read/planning/classe/:id
interface PlanningClasseData {
  classe: Classe
  creneaux: Creneau[]
  matieres: Matiere[]     // matières disponibles pour cette classe
  professeurs: Professeur[]  // professeurs affectés à cette classe
  salles: Salle[]         // toutes les salles
}
```

---

## Structure UI

```
PageHeader "Planning"

Select classe (si route /planning global)

PlanningGrid
  ├─ En-tête: colonnes = jours (Lundi → Samedi)
  ├─ Lignes: plages horaires (08:00 → 18:00, pas 30min ou 1h)
  └─ Cellules: créneaux avec couleur de matière

[Sur survol cellule vide:]
  └─ Bouton "+" → ouvre modal création

[Sur clic créneau:]
  └─ PlanningModals (édition ou suppression)
```

---

## PlanningGrid

- Grille CSS Grid : colonnes = jours + 1 (en-tête heures), lignes = tranches horaires
- Chaque créneau est positionné par `grid-row-start` / `grid-row-end` calculé depuis `planning.helpers.ts`
- Couleur de fond = `matiere.couleur`
- Affiche : matière_nom, salle, professeur_nom, heure_debut-heure_fin

---

## usePlanningDnd

- Gère le drag-and-drop natif HTML5 (`draggable`, `onDragStart`, `onDragOver`, `onDrop`)
- Au drop sur une cellule : calcule nouveau jour + heure_debut, appelle `PlanningContext.update(id, {...})`
- Détecte les conflits (même salle au même horaire) et affiche message d'erreur

---

## usePlanningState

```typescript
interface PlanningState {
  selectedClasse: string | null
  hoveredCell: PlanningCell | null
  dragState: DragState | null
  modalOpen: boolean
  editingCreneau: Creneau | null
  modalCell: PlanningCell | null
}
```

---

## Modales (PlanningModals)

### Création
Champs : matière (select), jour (pre-rempli depuis cellule cliquée), heure_debut, heure_fin, salle (SalleSelect), professeur (select)

### Édition
Mêmes champs, pré-remplis avec le créneau existant.

### Suppression
`ConfirmDialog` — appelle `PlanningContext.delete(id)`

---

## SalleSelect

- Charge les salles disponibles pour le créneau en cours via `SalleContext.getDisponibles(jour, heure_debut, heure_fin)`
- Affiche salle occupée avec indication de qui l'occupe

---

## planning.helpers.ts

```typescript
// Converti une heure string en index de grille
function heureToRow(heure: string): number

// Calcule la hauteur en cellules d'un créneau
function dureeCreneau(debut: string, fin: string): number

// Vérifie si deux créneaux se chevauchent
function seChevauche(a: Creneau, b: Creneau): boolean

// Génère les plages horaires affichées (labels colonne gauche)
function generatePlanningHours(): string[]
```

---

## Dépendances

- `src/hooks/usePageData.ts` → `usePlanningClasses`, `usePlanningClasse`
- `src/contexts/PlanningContext.tsx`
- `src/contexts/SalleContext.tsx`
- `src/components/shared/Modal.tsx`
- `src/components/shared/ConfirmDialog.tsx`
- `src/components/shared/Select.tsx`
