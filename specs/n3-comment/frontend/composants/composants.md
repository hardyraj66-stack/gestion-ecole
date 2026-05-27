# Composants Frontend

> **Couche** : N3 — COMMENT (composants)
> **Ce fichier contient** : inventaire des composants réutilisables, leur rôle et leur API
> **Ce fichier NE contient PAS** : détails métier (→ N2a), détails écrans (→ N2b)

---

## Composants partagés — `src/components/shared/`

Primitives de formulaire et de mise en page, sans logique métier.

| Composant | Rôle | Props clés |
|-----------|------|-----------|
| `Button` | Bouton avec variantes (primary, secondary, danger, ghost) | `variant`, `size`, `disabled`, `loading`, `onClick` |
| `Input` | Champ de saisie texte | `label`, `error`, `placeholder`, `value`, `onChange` |
| `Select` | Menu déroulant | `options: { value, label }[]`, `value`, `onChange` |
| `Textarea` | Champ texte multiligne | `label`, `rows`, `value`, `onChange` |
| `Checkbox` | Case à cocher | `label`, `checked`, `onChange` |
| `Table` | Tableau générique avec colonnes configurables | `columns`, `data`, `loading` |
| `Modal` | Fenêtre modale avec overlay | `open`, `onClose`, `title`, `children` |
| `Drawer` | Panneau latéral | `open`, `onClose`, `title`, `children` |
| `Pagination` | Contrôles de pagination | `page`, `total`, `limit`, `onChange` |
| `SearchInput` | Champ de recherche avec icône | `value`, `onChange`, `placeholder` |
| `ConfirmDialog` | Dialogue de confirmation avant action destructive | `open`, `onConfirm`, `onCancel`, `message` |
| `Form` | Wrapper formulaire avec gestion de soumission | `onSubmit`, `children` |
| `FormField` | Wrapper champ formulaire avec label + message d'erreur | `label`, `error`, `children` |

---

## Composants UI — `src/components/ui/`

Blocs UI de niveau supérieur, peuvent contenir de la logique de présentation.

| Composant | Rôle | Props clés |
|-----------|------|-----------|
| `PageHeader` | En-tête de page avec titre, sous-titre et actions | `title`, `subtitle`, `actions` |
| `StatCard` | Carte statistique (nombre + label + couleur) | `label`, `value`, `color`, `icon` |
| `EmptyState` | État vide illustré avec message et CTA | `title`, `description`, `action` |
| `Badge` | Étiquette colorée de statut | `label`, `color` ou `variant` |
| `ColorPicker` | Sélecteur de couleur (palette prédéfinie) | `value`, `onChange`, `colors` |
| `ExportMenu` | Menu d'export CSV/XLSX/PDF | `data`, `filename`, `columns` |

---

## Composant Layout — `src/components/Layout/`

| Composant | Rôle |
|-----------|------|
| `Layout` | Structure principale : sidebar + zone de contenu |
| `Sidebar` | Navigation latérale avec liens vers toutes les sections |
| `ArchiveBanner` | Bandeau orange affiché en mode archive — bouton « Quitter » |

---

## Utilitaire — `src/utils/cn.ts`

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
