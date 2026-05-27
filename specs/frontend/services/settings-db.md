# Service settingsDB

**Fichier source :** `src/services/settingsDB.ts`

Persistance des préférences utilisateur via IndexedDB (navigateur).

---

## Rôle

Sauvegarder et charger les paramètres de l'application (thème, couleur, langue) entre les sessions, sans backend.

---

## Interface

```typescript
interface AppSettings {
  theme: 'light' | 'dark'
  color: string        // couleur primaire (ex: '#3B82F6')
  language: string     // code langue : 'fr' | 'en' | 'mg'
}
```

---

## Fonctions

```typescript
async function loadSettings(): Promise<AppSettings>
// Charge depuis IndexedDB. Retourne les valeurs par défaut si absentes.
// Défauts: { theme: 'light', color: '#3B82F6', language: 'fr' }

async function saveSettings(settings: AppSettings): Promise<void>
// Persiste le settings dans IndexedDB sous la clé 'settings'.
```

---

## IndexedDB

- **Base :** `gestion-ecole-settings`
- **Version :** 1
- **Object store :** `settings`
- **Clé :** `'settings'` (string fixe)

---

## Dépendances

- Utilisé uniquement par `src/contexts/SettingsContext.tsx`
- Aucune dépendance externe (API IndexedDB native du navigateur)
