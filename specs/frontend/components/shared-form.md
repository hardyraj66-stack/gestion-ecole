# Composants Shared — Formulaires

**Dossier source :** `src/components/shared/`

---

## Input

**Fichier :** `Input.tsx`

Champ de saisie texte/email/number avec label et message d'erreur.

```typescript
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
}
```

- Stylé avec Tailwind (bordure focus colorée via `--color-primary`)
- `error` affiche un message rouge sous le champ
- `hint` affiche un texte gris d'aide
- Supporte tous les attributs natifs `<input>`

---

## Select

**Fichier :** `Select.tsx`

Liste déroulante avec label.

```typescript
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  options: Array<{ value: string; label: string }>
  placeholder?: string    // option vide en premier si défini
}
```

---

## Textarea

**Fichier :** `Textarea.tsx`

Zone de texte multiligne.

```typescript
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  rows?: number   // défaut: 3
}
```

---

## ColorPicker

**Fichier :** `ColorPicker.tsx`

Sélecteur de couleur. Affiche des pastilles cliquables + input color natif.

```typescript
interface ColorPickerProps {
  value: string             // couleur hex
  onChange: (color: string) => void
  presets?: string[]        // couleurs suggérées (pastilles cliquables)
  label?: string
}
```

---

## SearchInput

**Fichier :** `SearchInput.tsx`

Champ de recherche avec icône loupe et bouton clear.

```typescript
interface SearchInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  debounce?: number        // ms, défaut 300
}
```

- Debounce intégré : `onChange` n'est appelé qu'après N ms de pause
- Bouton ✕ pour effacer (visible si value non vide)

---

## SearchInputSuggestions

**Fichier :** `SearchInputSuggestions.tsx`

SearchInput avec dropdown de suggestions.

```typescript
interface SearchInputSuggestionsProps<T> {
  value: string
  onChange: (value: string) => void
  suggestions: T[]
  renderSuggestion: (item: T) => React.ReactNode
  onSelect: (item: T) => void
  placeholder?: string
}
```

- Dropdown s'affiche sous le champ si `suggestions.length > 0`
- Clic sur suggestion → `onSelect(item)`

---

## FormGrid

**Fichier :** `FormGrid.tsx`

Grille CSS pour les formulaires (2 colonnes sur desktop).

```typescript
interface FormGridProps {
  children: React.ReactNode
  cols?: 1 | 2     // défaut: 2
}
```

Usage :
```tsx
<FormGrid>
  <Input label="Nom" />
  <Input label="Prénom" />
</FormGrid>
```

---

## FilterBar

**Fichier :** `FilterBar.tsx`

Barre horizontale pour regrouper les filtres d'une liste.

```typescript
interface FilterBarProps {
  children: React.ReactNode
}
```

---

## InfoBar

**Fichier :** `InfoBar.tsx`

Barre d'informations récapitulatives (ex: infos d'une classe).

```typescript
interface InfoBarProps {
  items: Array<{
    label: string
    value: string | number
    icon?: string
  }>
}
```
