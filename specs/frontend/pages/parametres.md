# Page Parametres

**Route :** `/parametres`
**Dossier :** `src/pages/Parametres/`
**Fichier principal :** `Parametres.tsx`

---

## Rôle

Interface de personnalisation de l'application : thème sombre/clair, couleur primaire, et langue d'interface.

---

## Données

Toutes les données viennent de `SettingsContext` — pas d'appel réseau.

```typescript
const { theme, color, language, setTheme, setColor, setLanguage } = useSettings()
```

---

## Structure UI

```
PageHeader "Paramètres"

Section "Apparence"
  ├─ Toggle thème: Clair | Sombre
  └─ Sélecteur couleur primaire (6 options + ColorPicker)
       ○ Bleu (#3B82F6)  ○ Violet (#8B5CF6)  ○ Vert (#10B981)
       ○ Orange (#F59E0B)  ○ Rose (#EC4899)  ○ Indigo (#6366F1)

Section "Langue"
  └─ Radio/Select: Français | English | Malagasy
```

---

## Comportement

- Chaque modification est immédiatement appliquée (aucun bouton "Sauvegarder")
- Les changements sont persistés dans IndexedDB via `SettingsContext`
- Le thème change instantanément via la classe `dark` sur `<html>`
- La couleur change via la variable CSS `--color-primary`
- La langue change via `i18n.changeLanguage()`

---

## Internationalisation

Les 3 langues supportées :
- `fr` — Français (défaut)
- `en` — English
- `mg` — Malagasy

Les fichiers de traduction sont dans `src/i18n/locales/`.

---

## Dépendances

- `src/contexts/SettingsContext.tsx`
- `src/components/shared/ColorPicker.tsx`
- `src/components/ui/PageHeader.tsx`

---

# Page CreateSalle

**Route :** `/salles/nouvelle`
**Dossier :** `src/pages/CreateSalle/`
**Fichier principal :** `CreateSalle.tsx`

---

## Champs du formulaire

| Champ | Type | Obligatoire |
|-------|------|-------------|
| `nom` | text | oui |
| `capacite` | number | oui |
| `type` | select TypeSalle | oui |
| `description` | textarea | non |
| `batiment` | text | non |
| `etage` | text | non |
| `accessible_pmr` | checkbox | non |
| `equipements` | multi-checkbox | non |

## Soumission

```typescript
// SalleContext.create(data) → POST /salles
```

Après succès → `/salles`
