# Hooks usePeriodesData

**Fichier source :** `src/hooks/usePeriodesData.ts`

Hooks de lecture pour les périodes d'évaluation.

---

## usePeriodesData

```typescript
function usePeriodesData(annee_scolaire: string): ReturnType<typeof usePageFetch>
// Canal: 'periodes'
// Fetcher: readApi.periodes(annee_scolaire)
// Retourne: { periodes: PeriodeEvaluation[] }
```

## useActivePeriodeData

```typescript
function useActivePeriodeData(): ReturnType<typeof usePageFetch>
// Canal: 'periodes'
// Fetcher: readApi.activePeriode()
// Retourne: la période en cours ou null
```

---

## Dépendances

- `src/hooks/usePageData.ts` → `usePageFetch`
- `src/services/readApi.ts`
