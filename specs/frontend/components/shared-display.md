# Composants Shared — Affichage

**Dossier source :** `src/components/shared/`

---

## Button

**Fichier :** `Button.tsx`

Bouton primaire/secondaire/danger avec états de chargement.

```typescript
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  icon?: string      // nom d'icône optionnel (affiché avant le texte)
}
```

- `loading=true` → spinner à la place du texte, bouton désactivé
- `variant='primary'` → fond `--color-primary`
- `variant='danger'` → fond rouge
- `variant='ghost'` → transparent avec bordure

---

## Badge

**Fichier :** `Badge.tsx` (dans shared/)

Badge de statut coloré.

```typescript
interface BadgeProps {
  variant: BadgeVariant    // 'success'|'warning'|'danger'|'info'|'default'|'primary'
  children: React.ReactNode
  size?: 'sm' | 'md'
}
```

Couleurs :
- `success` → vert
- `warning` → orange
- `danger` → rouge
- `info` → bleu
- `default` → gris
- `primary` → `--color-primary`

---

## Card

**Fichier :** `Card.tsx`

Conteneur avec ombre légère et coins arrondis.

```typescript
interface CardProps {
  children: React.ReactNode
  className?: string
  padding?: 'sm' | 'md' | 'lg'   // défaut: 'md'
}
```

---

## Table

**Fichier :** `Table.tsx`

Tableau HTML stylé avec en-têtes et lignes alternées.

```typescript
interface TableProps {
  columns: Array<{
    key: string
    label: string
    width?: string
    render?: (value: any, row: any) => React.ReactNode
  }>
  data: any[]
  onRowClick?: (row: any) => void
  loading?: boolean
  emptyMessage?: string
}
```

- `render` : fonction de rendu personnalisée par colonne
- `onRowClick` : curseur pointer sur les lignes, clic déclenche la callback
- `loading` : affiche un squelette de chargement
- `emptyMessage` : affiché si `data.length === 0`

---

## Pagination

**Fichier :** `Pagination.tsx`

Contrôles de pagination complets.

```typescript
interface PaginationProps {
  page: number
  pages: number
  total: number
  onPageChange: (page: number) => void
}
```

Affiche : "Précédent | 1 2 3 ... N | Suivant" + "X résultats"

---

## MiniPagination

**Fichier :** `MiniPagination.tsx`

Version compacte (Précédent / Suivant uniquement).

```typescript
interface MiniPaginationProps {
  page: number
  pages: number
  onPageChange: (page: number) => void
}
```

---

## Avatar

**Fichier :** `Avatar.tsx`

Cercle avec initiales d'une personne.

```typescript
interface AvatarProps {
  nom: string
  prenom?: string
  size?: 'sm' | 'md' | 'lg'
  color?: string    // couleur de fond (défaut: calculé depuis le nom)
}
```

---

## Icon

**Fichier :** `Icon.tsx`

Wrapper pour les icônes SVG inline.

```typescript
interface IconProps {
  name: string      // nom de l'icône dans le registre
  size?: number     // px, défaut: 20
  className?: string
}
```

Les icônes sont définies dans le composant (ou chargées depuis un registre SVG statique).

---

## ProgressBar

**Fichier :** `ProgressBar.tsx`

Barre de progression colorée.

```typescript
interface ProgressBarProps {
  value: number        // 0-100
  color?: 'green' | 'orange' | 'red' | 'primary'
  showLabel?: boolean  // affiche "XX%" à droite
  size?: 'sm' | 'md'
}
```

---

## StatusDot

**Fichier :** `StatusDot.tsx`

Point coloré indiquant un statut (actif/inactif/etc).

```typescript
interface StatusDotProps {
  status: 'active' | 'inactive' | 'warning'
  label?: string
}
```

---

## ListItem

**Fichier :** `ListItem.tsx`

Ligne de liste générique avec icône, titre, sous-titre et action.

```typescript
interface ListItemProps {
  icon?: string
  title: string
  subtitle?: string
  action?: React.ReactNode
  onClick?: () => void
}
```

---

## AuditEntry

**Fichier :** `AuditEntry.tsx`

Entrée de journal d'audit (historique d'actions).

```typescript
interface AuditEntryProps {
  action: string
  date: string
  details?: string
  icon?: string
}
```

Affiche : date formatée + action + détails en style timeline.

---

## MatierePills

**Fichier :** `MatierePills.tsx`

Ensemble de pastilles colorées pour les matières d'un niveau.

```typescript
interface MatierePillsProps {
  matieres: Array<{ nom: string; couleur?: string; code: string }>
  max?: number     // nombre max de pastilles avant "+N autres"
}
```

---

## NiveauClassePopover

**Fichier :** `NiveauClassePopover.tsx`

Popover affichant les classes disponibles pour un niveau (utilisé dans la sélection de classe lors d'un changement d'élève).

---

## PipelineStep

**Fichier :** `PipelineStep.tsx`

Représentation visuelle d'un pipeline d'étapes (utilisé pour le cycle des années scolaires).

```typescript
interface PipelineStepProps {
  steps: Array<{
    label: string
    status: 'done' | 'active' | 'pending'
  }>
}
```

---

## ExportMenu

**Fichier :** `ExportMenu.tsx`

Menu dropdown pour les exports (CSV, XLSX, PDF).

```typescript
interface ExportMenuProps {
  endpoint: string     // endpoint backend d'export
  params?: Record<string, string>
  formats?: ('csv' | 'xlsx' | 'pdf')[]
}
```
