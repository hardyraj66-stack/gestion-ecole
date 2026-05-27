# Composants Shared — Modales et Overlays

**Dossier source :** `src/components/shared/`

---

## Modal

**Fichier :** `Modal.tsx`

Modal générique avec overlay, titre, contenu, et pied de page.

```typescript
interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  footer?: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
}
```

- Backdrop sombre avec `onClick` → `onClose`
- Touche Escape → `onClose`
- Scroll interne si contenu dépasse la hauteur max
- Animé (fade + scale)

---

## ConfirmDialog

**Fichier :** `ConfirmDialog.tsx`

Modal de confirmation pour les actions destructives.

```typescript
interface ConfirmDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void | Promise<void>
  title: string
  message: string
  confirmLabel?: string    // défaut: "Confirmer"
  cancelLabel?: string     // défaut: "Annuler"
  variant?: 'danger' | 'warning'
  loading?: boolean        // affiche spinner sur bouton confirmer
}
```

---

## DropdownMenu

**Fichier :** `DropdownMenu.tsx`

Menu contextuel dropdown.

```typescript
interface DropdownMenuProps {
  trigger: React.ReactNode         // élément déclencheur (bouton, etc.)
  items: Array<{
    label: string
    icon?: string
    onClick: () => void
    variant?: 'default' | 'danger'
    disabled?: boolean
  }>
  align?: 'left' | 'right'        // alignement du dropdown
}
```

- S'ouvre au clic sur `trigger`
- Se ferme au clic extérieur ou sur un item

---

## Popover

**Fichier :** `Popover.tsx`

Composant popover flottant avec positionnement automatique.

```typescript
interface PopoverProps {
  trigger: React.ReactNode
  content: React.ReactNode
  placement?: 'top' | 'bottom' | 'left' | 'right'
}
```

- Ouvre/ferme au survol ou au clic selon le mode
- Positionné avec CSS `position: absolute` et calcul offset

---

## Alert

**Fichier :** `Alert.tsx`

Bandeau d'alerte inline (pas une modale).

```typescript
interface AlertProps {
  variant: 'info' | 'success' | 'warning' | 'error'
  title?: string
  children: React.ReactNode
  onClose?: () => void
}
```
