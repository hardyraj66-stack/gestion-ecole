import { useCallback } from 'react';
import { usePageFetch } from './usePageData';
import { readApi } from '../services/readApi';

export function usePeriodesData(annee_scolaire: string) {
  return usePageFetch(
    useCallback(() => readApi.periodes(annee_scolaire), [annee_scolaire]),
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
