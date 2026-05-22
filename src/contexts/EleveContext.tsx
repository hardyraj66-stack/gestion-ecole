import { createContext, useContext, useEffect, useCallback, ReactNode } from 'react';
import { Eleve } from '../types';
import { API_BASE_URL } from '../config/api';
import { onEvent, notifyDataChange } from '../services/socketService';

interface EleveContextType {
  create: (data: Omit<Eleve, 'id'>) => Promise<boolean>;
  update: (id: string, data: Partial<Eleve>) => Promise<void>;
  setStatut: (id: string, statut: 'actif' | 'exclu' | 'parti') => Promise<void>;
}

const Ctx = createContext<EleveContextType | undefined>(undefined);

export function EleveProvider({ children }: { children: ReactNode }) {
  const create = useCallback(async (data: Omit<Eleve, 'id'>): Promise<boolean> => {
    try { const r = await fetch(`${API_BASE_URL}/eleves`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }); return r.ok; } catch { return false; }
  }, []);

  const update = useCallback(async (id: string, data: Partial<Eleve>) => {
    try { await fetch(`${API_BASE_URL}/eleves/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }); } catch {}
  }, []);

  const setStatut = useCallback(async (id: string, statut: 'actif' | 'exclu' | 'parti') => {
    try { await fetch(`${API_BASE_URL}/eleves/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ statut }) }); } catch {}
  }, []);

  useEffect(() => {
    const u1 = onEvent('eleve:created', () => notifyDataChange('eleves'));
    const u2 = onEvent('eleve:updated', () => notifyDataChange('eleves'));
    return () => { u1(); u2(); };
  }, []);

  return <Ctx.Provider value={{ create, update, setStatut }}>{children}</Ctx.Provider>;
}

export function useEleves() { const c = useContext(Ctx); if (!c) throw new Error('useEleves must be used within EleveProvider'); return c; }
