import { createContext, useContext, useEffect, useCallback, ReactNode } from 'react';
import { Eleve } from '../types';
import { API_BASE_URL } from '../config/api';
import { onEvent, notifyDataChange } from '../services/socketService';

interface EleveContextType {
  create: (data: Omit<Eleve, 'id'>) => Promise<{ id: string } | null>;
  update: (id: string, data: Partial<Eleve>) => Promise<boolean>;
  setStatut: (id: string, statut: 'actif' | 'exclu' | 'parti') => Promise<boolean>;
}

const Ctx = createContext<EleveContextType | undefined>(undefined);

export function EleveProvider({ children }: { children: ReactNode }) {
  const create = useCallback(async (data: Omit<Eleve, 'id'>): Promise<{ id: string } | null> => {
    try {
      const r = await fetch(`${API_BASE_URL}/eleves`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
      if (!r.ok) return null;
      const json = await r.json();
      return { id: json._id ?? json.id };
    } catch { return null; }
  }, []);

  const update = useCallback(async (id: string, data: Partial<Eleve>): Promise<boolean> => {
    try { const r = await fetch(`${API_BASE_URL}/eleves/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }); if (r.ok) { notifyDataChange('eleves'); return true; } return false; } catch (e) { console.error('EleveContext.update', e); return false; }
  }, []);

  const setStatut = useCallback(async (id: string, statut: 'actif' | 'exclu' | 'parti'): Promise<boolean> => {
    try { const r = await fetch(`${API_BASE_URL}/eleves/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ statut }) }); if (r.ok) { notifyDataChange('eleves'); return true; } return false; } catch (e) { console.error('EleveContext.setStatut', e); return false; }
  }, []);

  useEffect(() => {
    const u1 = onEvent('eleve:created', () => notifyDataChange('eleves'));
    const u2 = onEvent('eleve:updated', () => notifyDataChange('eleves'));
    return () => { u1(); u2(); };
  }, []);

  return <Ctx.Provider value={{ create, update, setStatut }}>{children}</Ctx.Provider>;
}

export function useEleves() { const c = useContext(Ctx); if (!c) throw new Error('useEleves must be used within EleveProvider'); return c; }
