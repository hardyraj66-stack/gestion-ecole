import { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import { AnneeScolaire } from '../types';
import { API_BASE_URL } from '../config/api';
import { onEvent, notifyDataChange } from '../services/socketService';

interface AnneeContextType {
  annees: AnneeScolaire[]; loading: boolean;
  active: AnneeScolaire | null; preparation: AnneeScolaire | null;
  getAll: () => Promise<void>;
  create: (data: { label: string; debut: string; fin: string }, onSuccess?: () => void, onError?: (e: string) => void) => Promise<void>;
  update: (id: string, data: Partial<AnneeScolaire>, onSuccess?: () => void, onError?: (e: string) => void) => Promise<void>;
  delete: (id: string, onError?: (e: string) => void) => Promise<void>;
  demarrer: (id: string, onSuccess?: () => void, onError?: (e: string) => void) => Promise<void>;
  terminer: (id: string, onSuccess?: (n: AnneeScolaire) => void, onError?: (e: string) => void) => Promise<void>;
}

const Ctx = createContext<AnneeContextType | undefined>(undefined);

export function AnneeProvider({ children }: { children: ReactNode }) {
  const [annees, setAnnees] = useState<AnneeScolaire[]>([]);
  const [loading, setLoading] = useState(false);

  const getAll = useCallback(async () => {
    try { setLoading(true); const r = await fetch(`${API_BASE_URL}/annees`); if (r.ok) { const d = await r.json(); setAnnees(d || []); } else setAnnees([]); }
    catch { setAnnees([]); } finally { setLoading(false); }
  }, []);

  const create = useCallback(async (data: { label: string; debut: string; fin: string }, onSuccess?: () => void, onError?: (e: string) => void) => {
    try { const r = await fetch(`${API_BASE_URL}/annees`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }); if (r.ok) { const i = await r.json(); setAnnees(p => [i, ...p]); onSuccess?.(); } else { const e = await r.json(); onError?.(e.message || 'Erreur'); } }
    catch { onError?.('Erreur de connexion'); }
  }, []);

  const update = useCallback(async (id: string, data: Partial<AnneeScolaire>, onSuccess?: () => void, onError?: (e: string) => void) => {
    try { const r = await fetch(`${API_BASE_URL}/annees/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }); if (r.ok) { const i = await r.json(); setAnnees(p => p.map(a => a.id === id ? i : a)); onSuccess?.(); } else { const e = await r.json(); onError?.(e.message || 'Erreur'); } }
    catch { onError?.('Erreur de connexion'); }
  }, []);

  const del = useCallback(async (id: string, onError?: (e: string) => void) => {
    try { const r = await fetch(`${API_BASE_URL}/annees/${id}`, { method: 'DELETE' }); if (r.ok) setAnnees(p => p.filter(a => a.id !== id)); else { const e = await r.json(); onError?.(e.message || 'Erreur'); } }
    catch { onError?.('Erreur de connexion'); }
  }, []);

  const demarrer = useCallback(async (id: string, onSuccess?: () => void, onError?: (e: string) => void) => {
    try { const r = await fetch(`${API_BASE_URL}/annees/${id}/demarrer`, { method: 'POST' }); if (r.ok) { const i = await r.json(); setAnnees(p => p.map(a => a.id === id ? i : a)); onSuccess?.(); } else { const e = await r.json(); onError?.(e.message || 'Erreur'); } }
    catch { onError?.('Erreur de connexion'); }
  }, []);

  const terminer = useCallback(async (id: string, onSuccess?: (n: AnneeScolaire) => void, onError?: (e: string) => void) => {
    try { const r = await fetch(`${API_BASE_URL}/annees/${id}/terminer`, { method: 'POST' }); if (r.ok) { const { terminee, nouvelle } = await r.json(); setAnnees(p => { let n = p.map(a => a.id === id ? terminee : a); if (!n.find(a => a.id === nouvelle.id)) n = [nouvelle, ...n]; return n; }); onSuccess?.(nouvelle); } else { const e = await r.json(); onError?.(e.message || 'Erreur'); } }
    catch { onError?.('Erreur de connexion'); }
  }, []);

  useEffect(() => {
    const u1 = onEvent<AnneeScolaire>('annee:created', () => { notifyDataChange('annees'); getAll(); });
    const u2 = onEvent<AnneeScolaire>('annee:updated', () => { notifyDataChange('annees'); getAll(); });
    const u3 = onEvent<{ id: string }>('annee:deleted', () => { notifyDataChange('annees'); getAll(); });
    return () => { u1(); u2(); u3(); };
  }, [getAll]);

  const active = useMemo(() => annees.find(a => a.statut === 'active') || null, [annees]);
  const preparation = useMemo(() => annees.find(a => a.statut === 'preparation') || null, [annees]);

  return <Ctx.Provider value={{ annees, loading, active, preparation, getAll, create, update, delete: del, demarrer, terminer }}>{children}</Ctx.Provider>;
}

export function useAnnees() { const c = useContext(Ctx); if (!c) throw new Error('useAnnees must be used within AnneeProvider'); return c; }
