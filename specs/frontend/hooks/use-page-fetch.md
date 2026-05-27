# Hook usePageFetch + hooks par page

**Fichier source :** `src/hooks/usePageData.ts`

---

## usePageFetch — hook central de lecture

### Signature

```typescript
function usePageFetch<T>(
  fetcher: () => Promise<T | null>,
  archiveExtractor?: (snapshot: any) => T,
  channel: Channel = 'all',
): {
  data: T | null
  loading: boolean
  error: boolean
  refreshing: boolean
  refresh: () => Promise<void>
  readOnly: boolean
}
```

### Comportement

1. **Premier chargement** : appelle `fetcher()`, `loading = true`
2. **Changement de `fetcher`** (page, search, etc.) : re-fetch silencieux si des données existent déjà (`loading` reste `false`, `refreshing = true`)
3. **Événement socket** : quand `notifyDataChange(channel)` est appelé, re-fetch silencieux après 500ms (délai pour laisser le temps au backend de persister)
4. **Mode archive** : si `isViewingArchive && snapshot && archiveExtractor`, utilise l'extracteur sur le snapshot local — pas d'appel réseau. Si `archiveExtractor` absent, passe `anneeLabel` dans le fetcher (via les hooks spécialisés)
5. **`readOnly`** : `true` en mode archive (les formulaires peuvent l'utiliser pour désactiver les actions d'écriture)

### Anti-rebond (isFetchingRef)

Un ref booléen `isFetchingRef` empêche les appels concurrents. Si un fetch est en cours, le suivant est ignoré.

### Mode archive — deux chemins

```
Cas 1: archiveExtractor fourni
  snapshot (en mémoire) → archiveExtractor(snapshot) → data
  (pas d'appel réseau)

Cas 2: pas d'archiveExtractor (pattern préféré)
  fetcher() avec viewingLabel injecté → GET /read/xxx?anneeLabel=XXXX
  (appel réseau avec filtre d'année)
```

---

## Hooks par page

Chaque hook spécialisé est une couche mince sur `usePageFetch` qui :
- Injecte `viewingLabel` depuis `ViewingContext` (si applicable)
- Définit le canal Socket.IO approprié
- Mémoïse le fetcher avec `useCallback` pour éviter les re-renders

### useDashboardData

```typescript
function useDashboardData(classesPage = 1): ReturnType<typeof usePageFetch>
// Canal: 'classes'
// Fetcher: readApi.dashboard(classesPage, 5, viewingLabel?)
```

### useClassesListData

```typescript
function useClassesListData(page = 1, search = '', niveau = ''): ReturnType<typeof usePageFetch>
// Canal: 'classes'
// Limit: 8 par page
// Fetcher: readApi.classesList(page, 8, search, niveau, viewingLabel?)
```

### useClasseElevesData

```typescript
function useClasseElevesData(classeId: string, page = 1, search = '', eleveId = ''): ReturnType<typeof usePageFetch>
// Canal: 'eleves'
// Limit: 10 par page
```

### useElevesListData

```typescript
function useElevesListData(page = 1, search = '', classeId = '', eleveId = ''): ReturnType<typeof usePageFetch>
// Canal: 'eleves'
// Limit: 12 par page
```

### useMatieresListData

```typescript
function useMatieresListData(page = 1, niveau = ''): ReturnType<typeof usePageFetch>
// Canal: 'matieres'
// Limit: 8 par page
// Pas de viewingLabel (matières indépendantes de l'année)
```

### useSallesListData

```typescript
function useSallesListData(page = 1, type = '', search = ''): ReturnType<typeof usePageFetch>
// Canal: 'salles'
// Limit: 10 par page
// Pas de viewingLabel
```

### usePlanningClasses

```typescript
function usePlanningClasses(): ReturnType<typeof usePageFetch>
// Canal: 'classes'
// Fetcher: readApi.planningClasses(viewingLabel?)
```

### usePlanningClasse

```typescript
function usePlanningClasse(classeId: string): ReturnType<typeof usePageFetch>
// Canal: 'planning'
// Guard: si classeId vide → Promise.resolve(null)
```

### useNotesPageData

```typescript
function useNotesPageData(): ReturnType<typeof usePageFetch>
// Canal: 'notes'
// Pas de paramètres (données statiques pour init de page)
```

### useNotesFiltersData

```typescript
function useNotesFiltersData(): ReturnType<typeof usePageFetch>
// Canal: 'notes'
// Fetcher: readApi.notesFilters(viewingLabel?)
```

### useBulletinData

```typescript
function useBulletinData(eleveId: string, trimestre: number): ReturnType<typeof usePageFetch>
// Canal: 'notes'
// Fetcher: readApi.bulletin(eleveId, trimestre, viewingLabel?)
```

### useEleveFicheData

```typescript
function useEleveFicheData(eleveId: string): ReturnType<typeof usePageFetch>
// Canal: 'eleves'
// Fetcher: readApi.eleveFiche(eleveId, viewingLabel?)
```

### useNiveauxListData

```typescript
function useNiveauxListData(): ReturnType<typeof usePageFetch>
// Canal: 'niveaux'
// Fetcher: readApi.niveaux(viewingLabel?)
```

### useProfesseursListData

```typescript
function useProfesseursListData(page = 1, search = ''): ReturnType<typeof usePageFetch>
// Canal: 'professeurs'
// Limit: 20 par page
// Pas de viewingLabel
```

### useProfesseurDetailData

```typescript
function useProfesseurDetailData(id: string): ReturnType<typeof usePageFetch>
// Canal: 'professeurs'
// Guard: si id vide → Promise.resolve(null)
```

---

## Dépendances

- `src/contexts/ViewingContext.tsx` → `useViewing()`
- `src/services/readApi.ts`
- `src/services/socketService.ts` → `onDataChange`, `Channel`
