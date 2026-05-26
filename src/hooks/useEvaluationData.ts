import { useCallback } from 'react';
import { usePageFetch } from './usePageData';
import { useViewing } from '../contexts/ViewingContext';
import { readApi } from '../services/readApi';

export function useEvaluationsListData(
  classeId?: string,
  matiereId?: string,
  trimestre?: number,
  statut?: string,
  page = 1,
) {
  const { viewingLabel } = useViewing();
  return usePageFetch(
    useCallback(
      () => readApi.evaluationsList(classeId, matiereId, trimestre, statut, page, viewingLabel ?? undefined),
      [classeId, matiereId, trimestre, statut, page, viewingLabel],
    ),
    undefined,
    'evaluations',
  );
}

export function useEvaluationDetailData(id: string) {
  return usePageFetch(
    useCallback(() => readApi.evaluationDetail(id), [id]),
    undefined,
    'evaluations',
  );
}
