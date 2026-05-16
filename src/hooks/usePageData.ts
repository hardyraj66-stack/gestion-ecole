import { useState, useEffect, useRef, useCallback } from 'react';
import { useViewing } from '../contexts/ViewingContext';
import { readApi } from '../services/readApi';
import { onDataChange, Channel } from '../services/socketService';

/**
 * Hook de fetch par page.
 * - re-fetch quand le fetcher change (page, search, classeId...)
 * - re-fetch socket ciblé par channel
 * - possibilité d'un refresh silencieux (sans loader plein écran)
 */
export function usePageFetch<T>(
  fetcher: () => Promise<T | null>,
  archiveExtractor?: (snapshot: any) => T,
  channel: Channel = 'all',
) {
  const { isViewingArchive, snapshot } = useViewing();
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const extractorRef = useRef(archiveExtractor);
  const isFetchingRef = useRef(false);
  extractorRef.current = archiveExtractor;

  const runFetch = useCallback(async (silent = false) => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    if (!silent) setLoading(true);
    if (silent) setRefreshing(true);

    // Archive
    if (isViewingArchive && snapshot && extractorRef.current) {
      try {
        setData(extractorRef.current(snapshot));
        setError(false);
      } catch {
        setData(null);
        setError(true);
      }
      if (!silent) setLoading(false);
      if (silent) setRefreshing(false);
      isFetchingRef.current = false;
      return;
    }

    // Live
    try {
      const result = await fetcher();
      setData(result);
      setError(!result);
    } catch {
      setData(null);
      setError(true);
    }

    if (!silent) setLoading(false);
    if (silent) setRefreshing(false);
    isFetchingRef.current = false;
  }, [fetcher, isViewingArchive, snapshot]);

  // Re-fetch quand page/search etc. change
  useEffect(() => {
    runFetch(false);
  }, [runFetch]);

  // Re-fetch quand un socket notifie un changement ciblé
  useEffect(() => {
    if (isViewingArchive) return;
    const unsub = onDataChange(channel, () => {
      setTimeout(() => {
        isFetchingRef.current = false;
        runFetch(true); // silent refresh → pas de PageLoader plein écran
      }, 500);
    });
    return unsub;
  }, [isViewingArchive, runFetch, channel]);

  const refresh = useCallback(async () => {
    isFetchingRef.current = false;
    await runFetch(false);
  }, [runFetch]);

  return { data, loading, error, refreshing, refresh, readOnly: isViewingArchive };
}

// ============ HOOKS PAR PAGE ============
export function useDashboardData(classesPage = 1) {
  return usePageFetch(useCallback(() => readApi.dashboard(classesPage, 5), [classesPage]), undefined, 'classes');
}

export function useClassesListData(page = 1, search = '') {
  return usePageFetch(useCallback(() => readApi.classesList(page, 8, search), [page, search]), undefined, 'classes');
}

export function useClasseElevesData(classeId: string, page = 1, search = '') {
  return usePageFetch(useCallback(() => readApi.classeEleves(classeId, page, 10, search), [classeId, page, search]), undefined, 'eleves');
}

export function useElevesListData(page = 1, search = '', classeId = '') {
  return usePageFetch(useCallback(() => readApi.elevesList(page, 12, search, classeId), [page, search, classeId]), undefined, 'eleves');
}

export function useMatieresListData(page = 1) {
  return usePageFetch(useCallback(() => readApi.matieresList(page, 8), [page]), undefined, 'matieres');
}

export function useSallesListData(page = 1) {
  return usePageFetch(useCallback(() => readApi.sallesList(page, 8), [page]), undefined, 'salles');
}

// Liste des niveaux/classes — ne rafraîchit pas sur move d'un créneau
export function usePlanningClasses() {
  return usePageFetch(useCallback(() => readApi.planningClasses(), []), undefined, 'classes');
}

// Détail d'une classe du planning — rafraîchit sur channel planning seulement
export function usePlanningClasse(classeId: string) {
  return usePageFetch(useCallback(() => classeId ? readApi.planningClasse(classeId) : Promise.resolve(null), [classeId]), undefined, 'planning');
}

export function useNotesPageData() {
  return usePageFetch(useCallback(() => readApi.notesPage(), []), undefined, 'notes');
}

export function useBulletinData(eleveId: string, trimestre: number) {
  return usePageFetch(useCallback(() => readApi.bulletin(eleveId, trimestre), [eleveId, trimestre]), undefined, 'notes');
}
