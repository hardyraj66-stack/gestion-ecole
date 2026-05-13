import { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import { AnneeScolaire, AnneeStatut } from '../types';
import { API_BASE_URL } from '../config/api';
import { onEvent } from '../services/socketService';
import { mockAnnees } from '../data/mockData';

interface AnneeContextType {
  annees: AnneeScolaire[];
  loading: boolean;
  active: AnneeScolaire | null;
  preparation: AnneeScolaire | null;
  getAll: () => Promise<void>;
  create: (data: { label: string; debut: string; fin: string }, onSuccess?: () => void, onError?: (e: string) => void) => Promise<void>;
  update: (id: string, data: Partial<AnneeScolaire>, onSuccess?: () => void, onError?: (e: string) => void) => Promise<void>;
  delete: (id: string, onError?: (e: string) => void) => Promise<void>;
  demarrer: (id: string, onSuccess?: () => void, onError?: (e: string) => void) => Promise<void>;
  terminer: (id: string, onSuccess?: (nouvelle: AnneeScolaire) => void, onError?: (e: string) => void) => Promise<void>;
}

const AnneeContext = createContext<AnneeContextType | undefined>(undefined);

export function AnneeProvider({ children }: { children: ReactNode }) {
  const [annees, setAnnees] = useState<AnneeScolaire[]>([]);
  const [loading, setLoading] = useState(true);

  const getAll = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/annees`);
      if (res.ok) {
        const data = await res.json();
        setAnnees(data && data.length > 0 ? data : mockAnnees);
      } else {
        setAnnees(mockAnnees);
      }
    } catch {
      setAnnees(mockAnnees);
    } finally {
      setLoading(false);
    }
  }, []);

  const create = useCallback(async (
    data: { label: string; debut: string; fin: string },
    onSuccess?: () => void,
    onError?: (e: string) => void,
  ) => {
    try {
      const res = await fetch(`${API_BASE_URL}/annees`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
      });
      if (res.ok) {
        const item = await res.json();
        setAnnees(prev => [item, ...prev]);
        onSuccess?.();
      } else {
        const err = await res.json();
        onError?.(err.message || 'Erreur');
      }
    } catch {
      const item: AnneeScolaire = { id: `annee-${Date.now()}`, ...data, statut: 'preparation', historique: [] };
      setAnnees(prev => [item, ...prev]);
      onSuccess?.();
    }
  }, []);

  const update = useCallback(async (
    id: string, data: Partial<AnneeScolaire>,
    onSuccess?: () => void, onError?: (e: string) => void,
  ) => {
    try {
      const res = await fetch(`${API_BASE_URL}/annees/${id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
      });
      if (res.ok) {
        const item = await res.json();
        setAnnees(prev => prev.map(a => a.id === id ? item : a));
        onSuccess?.();
      } else {
        const err = await res.json();
        onError?.(err.message || 'Erreur');
      }
    } catch {
      setAnnees(prev => prev.map(a => a.id === id ? { ...a, ...data } as AnneeScolaire : a));
      onSuccess?.();
    }
  }, []);

  const del = useCallback(async (id: string, onError?: (e: string) => void) => {
    try {
      const res = await fetch(`${API_BASE_URL}/annees/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setAnnees(prev => prev.filter(a => a.id !== id));
      } else {
        const err = await res.json();
        onError?.(err.message || 'Erreur');
      }
    } catch {
      setAnnees(prev => prev.filter(a => a.id !== id));
    }
  }, []);

  const demarrer = useCallback(async (
    id: string, onSuccess?: () => void, onError?: (e: string) => void,
  ) => {
    try {
      const res = await fetch(`${API_BASE_URL}/annees/${id}/demarrer`, { method: 'POST' });
      if (res.ok) {
        const item = await res.json();
        setAnnees(prev => prev.map(a => a.id === id ? item : a));
        onSuccess?.();
      } else {
        const err = await res.json();
        onError?.(err.message || 'Erreur');
      }
    } catch {
      setAnnees(prev => prev.map(a => a.id === id ? { ...a, statut: 'active' as AnneeStatut } : a));
      onSuccess?.();
    }
  }, []);

  const terminer = useCallback(async (
    id: string,
    onSuccess?: (nouvelle: AnneeScolaire) => void,
    onError?: (e: string) => void,
  ) => {
    try {
      const res = await fetch(`${API_BASE_URL}/annees/${id}/terminer`, { method: 'POST' });
      if (res.ok) {
        const { terminee, nouvelle } = await res.json();
        setAnnees(prev => {
          let next = prev.map(a => a.id === id ? terminee : a);
          if (!next.find(a => a.id === nouvelle.id)) next = [nouvelle, ...next];
          return next;
        });
        onSuccess?.(nouvelle);
      } else {
        const err = await res.json();
        onError?.(err.message || 'Erreur');
      }
    } catch {
      setAnnees(prev => prev.map(a => a.id === id ? { ...a, statut: 'terminee' as AnneeStatut } : a));
      onSuccess?.({ id: `annee-${Date.now()}`, label: '', debut: '', fin: '', statut: 'preparation', historique: [] });
    }
  }, []);

  useEffect(() => {
    getAll();

    const u1 = onEvent<AnneeScolaire>('annee:created', (data) => {
      setAnnees(prev => prev.find(a => a.id === data.id) ? prev : [data, ...prev]);
    });
    const u2 = onEvent<AnneeScolaire>('annee:updated', (data) => {
      setAnnees(prev => prev.map(a => a.id === data.id ? data : a));
    });
    const u3 = onEvent<{ id: string }>('annee:deleted', (data) => {
      setAnnees(prev => prev.filter(a => a.id !== data.id));
    });

    return () => { u1(); u2(); u3(); };
  }, [getAll]);

  const active = useMemo(() => annees.find(a => a.statut === 'active') || null, [annees]);
  const preparation = useMemo(() => annees.find(a => a.statut === 'preparation') || null, [annees]);

  return (
    <AnneeContext.Provider value={{ annees, loading, active, preparation, getAll, create, update, delete: del, demarrer, terminer }}>
      {children}
    </AnneeContext.Provider>
  );
}

export function useAnnees() {
  const ctx = useContext(AnneeContext);
  if (!ctx) throw new Error('useAnnees must be used within AnneeProvider');
  return ctx;
}
