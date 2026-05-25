import { useCallback } from 'react';
import { usePageFetch } from './usePageData';
import { readApi } from '../services/readApi';

export function useEvaluationsListData(
  classeId?: string,
  matiereId?: string,
  trimestre?: number,
  statut?: string,
  page = 1,
) {
  return usePageFetch(
    useCallback(
      () => readApi.evaluationsList(classeId, matiereId, trimestre, statut, page),
      [classeId, matiereId, trimestre, statut, page],
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
