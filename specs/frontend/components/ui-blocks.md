# Composants UI — Blocs de niveau page

**Dossier source :** `src/components/ui/`

---

## PageHeader

**Fichier :** `PageHeader.tsx`

En-tête de page unifié avec titre, breadcrumb optionnel, et zone d'actions.

```typescript
interface PageHeaderProps {
  title: string
  breadcrumb?: Array<{ label: string; href?: string }>
  actions?: React.ReactNode    // boutons, menus, etc.
  subtitle?: string
}
```

### Structure

```
[Breadcrumb: Accueil > Section > Page]
H1: [Title]
[Subtitle optionnel]
                              [Actions (boutons, menus)]
```

---

## PageLoader

**Fichier :** `PageLoader.tsx`

Squelette de chargement affiché pendant le premier fetch.

```typescript
interface PageLoaderProps {
  variant?: 'table' | 'cards' | 'form' | 'detail'
}
```

- `table` : lignes de tableau skeleton
- `cards` : grille de cartes skeleton
- `form` : champs de formulaire skeleton
- `detail` : blocs de détail skeleton

Utilise des div animées (`animate-pulse`) imitant la forme du contenu final.

---

## StatCard

**Fichier :** `StatCard.tsx`

Carte de statistique avec icône, valeur, et libellé.

```typescript
interface StatCardProps {
  label: string
  value: string | number
  icon: string               // nom d'icône
  trend?: {
    value: number            // % d'évolution
    direction: 'up' | 'down' | 'stable'
  }
  color?: string             // couleur de l'icône (défaut: --color-primary)
}
```

### Structure

```
[Icône colorée]  [Valeur en gros]
                 [Label]
                 [Trend optionnel: +5% ▲]
```

---

## EmptyState

**Fichier :** `EmptyState.tsx`

Placeholder affiché quand une liste est vide.

```typescript
interface EmptyStateProps {
  icon?: string
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
}
```

### Structure

```
[Icône large, style muted]
[Titre]
[Description optionnelle]
[Bouton action optionnel]
```

---

## Badge (ui/)

**Fichier :** `ui/Badge.tsx`

Version UI (niveau page) du Badge — fonctionne identiquement à `shared/Badge.tsx`.
Certaines pages importent depuis `ui/`, d'autres depuis `shared/`.

---

## Dépendances communes

- `src/utils/cn.ts` → `cn()` pour la composition de classes
- `src/components/shared/Icon.tsx`
