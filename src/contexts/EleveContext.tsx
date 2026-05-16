import { createContext, useContext, useEffect, useCallback, ReactNode } from 'react';
import { Eleve } from '../types';
import { API_BASE_URL } from '../config/api';
import { onEvent, notifyDataChange } from '../services/socketService';

interface EleveContextType {
  create: (data: Omit<Eleve, 'id'>) => Promise<boolean>;
  update: (id: string, data: Partial<Eleve>) => Promise<void>;
  delete: (id: string) => Promise<void>;
}

const Ctx = createContext<EleveContextType | undefined>(undefined);

export function EleveProvider({ children }: { children: ReactNode }) {
  const create = useCallback(async (data: Omit<Eleve, 'id'>): Promise<boolean> => {
    try { const r = await fetch(`${API_BASE_URL}/eleves`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }); return r.ok; } catch { return false; }
  }, []);

  const update = useCallback(async (id: string, data: Partial<Eleve>) => {
    try { await fetch(`${API_BASE_URL}/eleves/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }); } catch {}
  }, []);

  const del = useCallback(async (id: string) => {
    try { await fetch(`${API_BASE_URL}/eleves/${id}`, { method: 'DELETE' }); } catch {}
  }, []);

  useEffect(() => {
    const u1 = onEvent('eleve:created', () => notifyDataChange('eleves'));
    const u2 = onEvent('eleve:updated', () => notifyDataChange('eleves'));
    const u3 = onEvent('eleve:deleted', () => notifyDataChange('eleves'));
    return () => { u1(); u2(); u3(); };
  }, []);

  return <Ctx.Provider value={{ create, update, delete: del }}>{children}</Ctx.Provider>;
}

export function useEleves() { const c = useContext(Ctx); if (!c) throw new Error('useEleves must be used within EleveProvider'); return c; }
