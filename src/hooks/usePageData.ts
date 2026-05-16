import { useState, useEffect, useRef, useCallback } from 'react';
import { useViewing } from '../contexts/ViewingContext';
import { readApi } from '../services/readApi';
import { onDataChange } from '../services/socketService';

/**
 * Hook de fetch par page.
 * Re-fetch quand le fetcher change (page, search, etc.) ou quand un socket notifie.
 * Le fetcher DOIT être wrappé dans useCallback avec les bonnes deps.
 */
export function usePageFetch<T>(
  fetcher: () => Promise<T | null>,
  archiveExtractor?: (snapshot: any) => T,
) {
  const { isViewingArchive, snapshot } = useViewing();
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const extractorRef = useRef(archiveExtractor);
  const isFetchingRef = useRef(false);
  extractorRef.current = archiveExtractor;

  // Le fetcher est directement dans les deps — quand page/search change,
  // le useCallback parent crée une nouvelle ref, et cet effet se redéclenche.
  useEffect(() => {
    let cancelled = false;
    isFetchingRef.current = false;

    const run = async () => {
      if (isFetchingRef.current) return;
      isFetchingRef.current = true;

      // Archive
      if (isViewingArchive && snapshot && extractorRef.current) {
        try {
          const result = extractorRef.current(snapshot);
          if (!cancelled) { setData(result); setLoading(false); setError(false); }
        } catch {
          if (!cancelled) { setData(null); setLoading(false); setError(true); }
        }
        isFetchingRef.current = false;
        return;
      }

      // Live
      if (!cancelled) setLoading(true);
      try {
        const result = await fetcher();
        if (!cancelled) { setData(result); setError(!result); }
      } catch {
        if (!cancelled) { setData(null); setError(true); }
      }
      if (!cancelled) setLoading(false);
      isFetchingRef.current = false;
    };

    run();
    return () => { cancelled = true; };
  }, [fetcher, isViewingArchive, snapshot]);

  // Re-fetch quand un socket notifie un changement
  useEffect(() => {
    if (isViewingArchive) return;
    const unsub = onDataChange(() => {
      setTimeout(async () => {
        isFetchingRef.current = false;
        setLoading(true);
        try {
          const result = await fetcher();
          setData(result);
          setError(!result);
        } catch {
          setError(true);
        }
        setLoading(false);
      }, 500);
    });
    return unsub;
  }, [isViewingArchive, fetcher]);

  const refresh = useCallback(async () => {
    isFetchingRef.current = false;
    setLoading(true);
    try {
      const result = await fetcher();
      setData(result);
      setError(!result);
    } catch {
      setData(null);
      setError(true);
    }
    setLoading(false);
  }, [fetcher]);

  return { data, loading, error, refresh, readOnly: isViewingArchive };
}

// ============ HOOKS PAR PAGE ============

export function useDashboardData(classesPage = 1) {
  return usePageFetch(
    useCallback(() => readApi.dashboard(classesPage, 5), [classesPage]),
  );
}

export function useClassesListData(page = 1, search = '') {
  return usePageFetch(
    useCallback(() => readApi.classesList(page, 8, search), [page, search]),
  );
}

export function useClasseElevesData(classeId: string, page = 1, search = '') {
  return usePageFetch(
    useCallback(() => readApi.classeEleves(classeId, page, 10, search), [classeId, page, search]),
  );
}

export function useElevesListData(page = 1, search = '', classeId = '') {
  return usePageFetch(
    useCallback(() => readApi.elevesList(page, 12, search, classeId), [page, search, classeId]),
  );
}

export function useMatieresListData(page = 1) {
  return usePageFetch(
    useCallback(() => readApi.matieresList(page, 8), [page]),
  );
}

export function useSallesListData(page = 1) {
  return usePageFetch(
    useCallback(() => readApi.sallesList(page, 8), [page]),
  );
}

export function usePlanningClasses() {
  return usePageFetch(
    useCallback(() => readApi.planningClasses(), []),
  );
}

export function usePlanningClasse(classeId: string) {
  return usePageFetch(
    useCallback(() => classeId ? readApi.planningClasse(classeId) : Promise.resolve(null), [classeId]),
  );
}

export function useNotesPageData() {
  return usePageFetch(
    useCallback(() => readApi.notesPage(), []),
  );
}

export function useBulletinData(eleveId: string, trimestre: number) {
  return usePageFetch(
    useCallback(() => readApi.bulletin(eleveId, trimestre), [eleveId, trimestre]),
  );
}
