# Hooks useEvaluationData

**Fichier source :** `src/hooks/useEvaluationData.ts`

Hooks de lecture pour les évaluations. Construits sur `usePageFetch`.

---

## useEvaluationsListData

```typescript
function useEvaluationsListData(
  classeId?: string,
  matiereId?: string,
  trimestre?: number,
  statut?: string,
  page = 1,
  anneeLabel?: string,
): ReturnType<typeof usePageFetch>
// Canal: 'evaluations'
// Fetcher: readApi.evaluationsList(classeId, matiereId, trimestre, statut, page, anneeLabel)
```

## useEvaluationDetailData

```typescript
function useEvaluationDetailData(id: string): ReturnType<typeof usePageFetch>
// Canal: 'evaluations'
// Guard: si id vide → Promise.resolve(null)
// Fetcher: readApi.evaluationDetail(id)
```

---

## Dépendances

- `src/hooks/usePageData.ts` → `usePageFetch`
- `src/services/readApi.ts`
