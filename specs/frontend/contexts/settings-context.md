# SettingsContext

**Fichier source :** `src/contexts/SettingsContext.tsx`

Gère les préférences utilisateur : thème sombre/clair, couleur primaire, et langue d'interface.

---

## Interface du contexte

```typescript
interface SettingsContextType {
  theme: 'light' | 'dark'
  color: string                            // couleur primaire hex
  language: string                         // 'fr' | 'en' | 'mg'
  setTheme: (t: 'light' | 'dark') => void
  setColor: (c: string) => void
  setLanguage: (l: string) => void
}
```

---

## Valeurs par défaut

```typescript
{ theme: 'light', color: '#3B82F6', language: 'fr' }
```

---

## Persistance

- Chargement initial depuis IndexedDB via `loadSettings()` au montage
- Chaque modification sauvegardée dans IndexedDB via `saveSettings()`
- En cas d'erreur IndexedDB, les valeurs par défaut sont utilisées

---

## Effet sur le DOM

- **Thème** : ajoute/retire la classe `dark` sur `document.documentElement` (`<html>`)
- **Couleur** : injecte la variable CSS `--color-primary` sur `document.documentElement`
- **Langue** : appelle `i18n.changeLanguage(language)` pour basculer les traductions

---

## Couleurs disponibles

6 couleurs prédéfinies proposées dans `Parametres.tsx` :
- Bleu : `#3B82F6`
- Violet : `#8B5CF6`
- Vert : `#10B981`
- Orange : `#F59E0B`
- Rose : `#EC4899`
- Indigo : `#6366F1`

---

## Dépendances

- `src/services/settingsDB.ts`
- `src/i18n/index.ts` (via `i18n.changeLanguage`)
