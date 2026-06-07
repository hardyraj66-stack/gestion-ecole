import { useCallback } from 'react';
import { usePageFetch } from './usePageData';
import { readApi } from '../services/readApi';

export function usePeriodesData(anneeScolaireId: string) {
  return usePageFetch(
    useCallback(() => readApi.periodes(anneeScolaireId), [anneeScolaireId]),
    undefined,
    'periodes',
  );
}

export function useActivePeriodeData() {
  return usePageFetch(
    useCallback(() => readApi.activePeriode(), []),
    undefined,
    'periodes',
  );
}
