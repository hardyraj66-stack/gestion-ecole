# Utilitaires helpers

**Fichier source :** `src/utils/helpers.ts`

Fonctions pures utilitaires, sans état ni effets de bord.

---

## Fonctions

### getInitials(nom, prenom?)

```typescript
function getInitials(nom: string, prenom?: string): string
// Retourne les initiales d'un nom.
// Exemples:
//   getInitials("Dupont", "Marie") → "MD"
//   getInitials("Dupont") → "D"
```

### getAge(dateNaissance)

```typescript
function getAge(dateNaissance: string): number
// Calcule l'âge en années depuis une date ISO.
// getAge("2010-05-15") → 15 (en 2025)
```

### formatDate(date, format?)

```typescript
function formatDate(date: string, format?: 'short' | 'long' | 'relative'): string
// 'short' (défaut): "15/05/2025"
// 'long': "15 mai 2025"
// 'relative': "il y a 3 jours"
```

### getNoteColor(note)

```typescript
function getNoteColor(note: number): string
// Retourne une classe Tailwind de couleur selon la valeur.
// note < 8   → 'text-red-600'
// note < 10  → 'text-orange-500'
// note < 14  → 'text-yellow-600'
// note >= 14 → 'text-green-600'
```

### getMention(note)

```typescript
function getMention(note: number): string
// note < 10  → 'Insuffisant'
// note < 12  → 'Passable'
// note < 14  → 'Assez bien'
// note < 16  → 'Bien'
// note >= 16 → 'Très bien'
```

### getTypeLabel(type)

```typescript
function getTypeLabel(type: TypeSalle): string
// Retourne le label lisible d'un type de salle.
// 'laboratoire' → 'Laboratoire'
// 'informatique' → 'Salle informatique'
// etc.
```

### generateSchoolYears(from?, count?)

```typescript
function generateSchoolYears(from?: number, count?: number): string[]
// Génère une liste d'années scolaires au format "YYYY-YYYY".
// generateSchoolYears(2020, 5) → ['2020-2021', '2021-2022', ..., '2024-2025']
```

### generatePlanningHours(start?, end?, step?)

```typescript
function generatePlanningHours(start = '08:00', end = '18:00', step = 30): string[]
// Génère les plages horaires pour le planning.
// Retourne: ['08:00', '08:30', '09:00', ..., '18:00']
```

### calculateDuration(heureDebut, heureFin)

```typescript
function calculateDuration(heureDebut: string, heureFin: string): number
// Retourne la durée en minutes.
// calculateDuration('08:00', '10:30') → 150
```

---

# Utilitaire cn

**Fichier source :** `src/utils/cn.ts`

```typescript
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs: ClassValue[]): string
// Combine des classes CSS avec clsx (conditions, tableaux) et tailwind-merge
// (fusion intelligente des classes Tailwind conflictuelles).
//
// Exemple:
//   cn('px-4', condition && 'font-bold', 'px-2')
//   → 'font-bold px-2'  (px-2 remplace px-4 grâce à twMerge)
```

Utilisé partout dans les composants pour construire les `className`.
