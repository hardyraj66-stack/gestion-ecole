# Composants Frontend

> **Couche** : N3 — COMMENT (composants)
> **Ce fichier contient** : inventaire des composants réutilisables, leur rôle et leur API
> **Ce fichier NE contient PAS** : détails métier (→ N2a), détails écrans (→ N2b)

---

## Composants partagés — `frontend/src/components/shared/`

Primitives de formulaire, d'affichage et de mise en page, sans logique métier.

| Composant | Rôle | Props clés |
|-----------|------|-----------|
| `Button` | Bouton (variantes `primary`, `secondary`, `outline`, `danger`, `link`, `icon`) | `variant`, `size`, `loading`, `fullWidth`, `onClick` |
| `Input` | Champ de saisie texte (icône optionnelle) | `label`, `error`, `hint`, `icon`, `fullWidth` |
| `Select` | Menu déroulant | `options`, `label`, `error`, `hint`, `fullWidth`, `badge` |
| `Textarea` | Champ texte multiligne | `label`, `error`, `hint`, `fullWidth` |
| `Table` | Conteneur de tableau (wrapper stylé `<table>`) | `children`, `className` |
| `Modal` | Fenêtre modale avec overlay | `title`, `onClose`, `footer`, `children` |
| `ConfirmDialog` | Dialogue de confirmation (via `useConfirm()`) | `message`, `title`, `variant`, `confirmText` |
| `Alert` | Bandeau de message (info, succès, avertissement, erreur) | `variant`, `icon`, `success`, `children` |
| `InfoBar` | Barre d'informations en ligne | `items`, `children` |
| `Card` | Conteneur carte | `children`, `padding`, `borderTop`, `onClick` |
| `Avatar` | Pastille d'initiales | `initiales`, `genre`, `size` |
| `Badge` *(voir aussi ui/)* | Étiquette de statut | `label`, `variant` |
| `Icon` | Icône SVG centralisée (par `path`) | `path`, `size`, `strokeWidth` |
| `Pagination` | Pagination complète | `currentPage`, `totalItems`, `pageSize`, `onPageChange` |
| `MiniPagination` | Pagination compacte | `page`, `totalPages`, `onPageChange` |
| `SearchInput` | Champ de recherche simple | `onSearch` |
| `SearchInputSuggestions` | Recherche avec auto-complétion | `value`, `onChange`, `onSelect`, `fetchSuggestions`, `debounceMs` |
| `FilterBar` | Barre de filtres de liste | `children`, `count`, `countLabel` |
| `FormGrid` | Grille de mise en page de formulaire | `children`, `columns` |
| `DropdownMenu` | Menu déroulant d'actions | `items`, `open`, `onOpenChange`, `align`, `triggerLabel` |
| `Popover` | Contenu flottant ancré | `trigger`, `children`, `open`, `onClose`, `align` |
| `ColorPicker` | Sélecteur de couleur (palette prédéfinie) | `label`, `colors`, `value`, `onChange` |
| `ExportMenu` | Menu d'export CSV/XLSX | `csvUrl`, `xlsxUrl`, `label` |
| `ProgressBar` | Barre de progression | `value`, `max`, `showLabel`, `variant`, `size` |
| `PipelineStep` | Étape d'un pipeline | `label`, `active` |
| `StatItem` | Statistique en ligne | `label`, `value` |
| `StatusDot` | Pastille d'état colorée | `color`, `size` |
| `ListItem` | Élément de liste générique | `title`, `subtitle`, `selected`, `onClick`, `trailing` |
| `AuditEntry` | Entrée d'historique/audit | `details`, `date`, `context`, `color` |
| `MatierePills` | Pastilles de matières (sélection) | `matieres`, `selectedIds`, `onToggle`, `singleSelect` |
| `NiveauClassePopover` | Popover de sélection niveau/classe | `selectedNiveau`, `selectedClasseId`, `onChange` |

---

## Composants UI — `frontend/src/components/ui/`

Blocs UI de niveau supérieur, peuvent contenir de la logique de présentation.

| Composant | Rôle | Props clés |
|-----------|------|-----------|
| `PageHeader` | En-tête de page avec titre, sous-titre et actions | `title`, `subtitle`, `children` |
| `StatCard` | Carte statistique (nombre + label + couleur) | `label`, `value`, `color`, `icon` |
| `EmptyState` | État vide illustré avec message et CTA | `title`, `description`, `action` |
| `PageLoader` | Indicateur de chargement plein écran | — |
| `Badge` | Étiquette colorée de statut | `label`, `variant` |

---

## Composant Layout — `frontend/src/components/layout/`

| Composant | Rôle |
|-----------|------|
| `Layout` | Structure principale : sidebar + zone de contenu |
| `Sidebar` | Navigation latérale (marque `BrandWordmark`, liens par section) ; affiche l'utilisateur connecté + son rôle, le bouton de **déconnexion** (avec confirmation) et le lien `/utilisateurs` réservé aux `admin` (`hasRole('admin')`) |
| `ArchiveBanner` | Bandeau orange affiché en mode archive — bouton « Quitter » |

---

## Composant Auth — `frontend/src/components/auth/`

| Composant | Rôle |
|-----------|------|
| `RequireAuth` | Garde de route : redirige vers `/login` si non authentifié, vers `/dashboard` si le rôle ne fait pas partie de `roles`. Prop optionnelle `roles?: Role[]`. |

---

## Composants Brand — `frontend/src/components/brand/`

Identité visuelle Ekolova, adaptée à la couleur primaire du thème.

| Composant | Rôle |
|-----------|------|
| `Logo` | Logo complet réutilisable : icône + wordmark (`layout`, `tone`, `iconSize`) |
| `BrandIcon` | Icône seule | 
| `BrandWordmark` | Wordmark texte « EKOLOVA » (EKO + LOVA en couleur d'accent) |

---

## Utilitaire — `frontend/src/utils/cn.ts`

```typescript
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

Utilisé partout pour composer des classes Tailwind conditionnellement sans conflits.

---

## Conventions de composants

- Les composants partagés n'ont **aucune dépendance** vers les contextes ou les services
- Les composants de page consomment les hooks (`usePageFetch`) et les contextes directement
- Pas de prop-drilling profond — les données de page viennent du hook, les mutations du contexte
- Nommage : PascalCase pour les composants, camelCase pour les hooks (`useSomething`)
