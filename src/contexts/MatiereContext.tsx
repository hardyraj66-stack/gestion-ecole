import { createContext, useContext, useEffect, useCallback, ReactNode } from 'react';
import { Matiere } from '../types';
import { API_BASE_URL } from '../config/api';
import { onEvent, notifyDataChange } from '../services/socketService';

interface MatiereContextType {
  create: (data: Omit<Matiere, 'id'>) => Promise<boolean>;
  update: (id: string, data: Partial<Matiere>) => Promise<void>;
  delete: (id: string) => Promise<void>;
}

const Ctx = createContext<MatiereContextType | undefined>(undefined);

export function MatiereProvider({ children }: { children: ReactNode }) {
  const create = useCallback(async (d: Omit<Matiere, 'id'>): Promise<boolean> => {
    try { const r = await fetch(`${API_BASE_URL}/matieres`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(d) }); return r.ok; } catch { return false; }
  }, []);
  const update = useCallback(async (id: string, d: Partial<Matiere>) => {
    try { await fetch(`${API_BASE_URL}/matieres/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(d) }); } catch {}
  }, []);
  const del = useCallback(async (id: string) => {
    try { await fetch(`${API_BASE_URL}/matieres/${id}`, { method: 'DELETE' }); } catch {}
  }, []);

  useEffect(() => {
    const u1 = onEvent('matiere:created', () => notifyDataChange('matieres'));
    const u2 = onEvent('matiere:updated', () => notifyDataChange('matieres'));
    const u3 = onEvent('matiere:deleted', () => notifyDataChange('matieres'));
    return () => { u1(); u2(); u3(); };
  }, []);

  return <Ctx.Provider value={{ create, update, delete: del }}>{children}</Ctx.Provider>;
}

export function useMatieres() { const c = useContext(Ctx); if (!c) throw new Error('useMatieres must be used within MatiereProvider'); return c; }
