# Composants Frontend

> **Couche** : N3 — COMMENT (composants)
> **Ce fichier contient** : inventaire des composants réutilisables, leur rôle et leur API
> **Ce fichier NE contient PAS** : détails métier (→ N2a), détails écrans (→ N2b)

---

## Composants partagés — `frontend/src/components/shared/`

Primitives de formulaire, d'affichage et de mise en page, sans logique métier.

| Composant | Rôle | Props clés |
|-----------|------|-----------|
| `Button` | Bouton avec variantes (primary, outline, danger…) | `variant`, `size`, `loading`, `fullWidth`, `onClick` |
| `Input` | Champ de saisie texte (icône optionnelle) | `label`, `error`, `icon`, `value`, `onChange` |
| `Select` | Menu déroulant | `options: { value, label }[]`, `value`, `fullWidth`, `onChange` |
| `Textarea` | Champ texte multiligne | `label`, `rows`, `value`, `onChange` |
| `Table` | Tableau générique avec colonnes configurables | `columns`, `data`, `loading` |
| `Modal` | Fenêtre modale avec overlay | `title`, `onClose`, `footer`, `children` |
| `ConfirmDialog` | Dialogue de confirmation (via `useConfirm`) | `message`, `title`, `variant`, `confirmText` |
| `Alert` / `InfoBar` | Bandeaux de message (info, succès, avertissement, erreur) | `variant`, `children` |
| `Card` | Conteneur carte | `children` |
| `Avatar` | Pastille d'initiales / photo | `name`, `size` |
| `Badge` *(voir aussi ui/)* | — | — |
| `Icon` | Icône SVG centralisée | `name`, `size` |
| `Pagination` / `MiniPagination` | Contrôles de pagination | `page`, `total`, `limit`, `onChange` |
| `SearchInput` / `SearchInputSuggestions` | Recherche, avec ou sans suggestions | `value`, `onChange`, `suggestions` |
| `FilterBar` | Barre de filtres de liste | `children` |
| `FormGrid` | Grille de mise en page de formulaire | `children` |
| `DropdownMenu` / `Popover` | Menu/contenu flottant | `trigger`, `children` |
| `ColorPicker` | Sélecteur de couleur (palette prédéfinie) | `value`, `onChange`, `colors` |
| `ExportMenu` | Menu d'export CSV/XLSX/PDF/Carte | `data`, `filename`, `columns` |
| `ProgressBar` / `PipelineStep` | Progression / étapes d'un pipeline | `value` · `step`, `status` |
| `StatItem` / `StatusDot` | Statistique inline / pastille d'état | `label`, `value` · `status` |
| `ListItem` | Élément de liste générique | `children` |
| `AuditEntry` | Entrée d'historique/audit | `entry` |
| `MatierePills` | Pastilles de matières | `matieres` |
| `NiveauClassePopover` | Popover niveau/classe | `niveau` |

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
