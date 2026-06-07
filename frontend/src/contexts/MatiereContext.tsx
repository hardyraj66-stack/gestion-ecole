import { createContext, useContext, useEffect, useCallback, ReactNode } from 'react';
import { Matiere } from '../types';
import { API_BASE_URL } from '../config/api';
import { onEvent, notifyDataChange } from '../services/socketService';

interface MatiereContextType {
  create: (data: Omit<Matiere, 'id'>) => Promise<boolean>;
  update: (id: string, data: Partial<Matiere>) => Promise<boolean>;
}

const Ctx = createContext<MatiereContextType | undefined>(undefined);

export function MatiereProvider({ children }: { children: ReactNode }) {
  const create = useCallback(async (d: Omit<Matiere, 'id'>): Promise<boolean> => {
    try { const r = await fetch(`${API_BASE_URL}/matieres`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(d) }); return r.ok; } catch { return false; }
  }, []);
  const update = useCallback(async (id: string, d: Partial<Matiere>): Promise<boolean> => {
    try { const r = await fetch(`${API_BASE_URL}/matieres/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(d) }); return r.ok; } catch (e) { console.error('MatiereContext.update', e); return false; }
  }, []);

  useEffect(() => {
    const u1 = onEvent('matiere:created', () => notifyDataChange('matieres'));
    const u2 = onEvent('matiere:updated', () => notifyDataChange('matieres'));
    return () => { u1(); u2(); };
  }, []);

  return <Ctx.Provider value={{ create, update }}>{children}</Ctx.Provider>;
}

export function useMatieres() { const c = useContext(Ctx); if (!c) throw new Error('useMatieres must be used within MatiereProvider'); return c; }
