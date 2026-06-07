import { createContext, useContext, useEffect, useCallback, ReactNode } from 'react';
import { Eleve } from '../types';
import { API_BASE_URL } from '../config/api';
import { onEvent, notifyDataChange } from '../services/socketService';

interface EleveContextType {
  create: (data: Omit<Eleve, 'id'>) => Promise<{ id: string } | null>;
  update: (id: string, data: Partial<Eleve>) => Promise<boolean>;
  setStatut: (id: string, statut: 'actif' | 'exclu' | 'parti') => Promise<boolean>;
  reinscire: (eleveId: string, classeId: string, anneeScolaireId: string, forceCapacite?: boolean) => Promise<{ ok: true; data: any } | { ok: false; code: string; message: string; meta?: any }>;
}

const Ctx = createContext<EleveContextType | undefined>(undefined);

export function EleveProvider({ children }: { children: ReactNode }) {
  const create = useCallback(async (data: Omit<Eleve, 'id'>): Promise<{ id: string } | null> => {
    try {
      // Utiliser classeId (nouveau système) au lieu de classe_id
      const payload: any = { ...data };
      if ((data as any).classe_id && !(data as any).classeId) {
        payload.classeId = (data as any).classe_id;
        delete payload.classe_id;
      }
      const r = await fetch(`${API_BASE_URL}/eleves`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
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

  const reinscire = useCallback(async (eleveId: string, classeId: string, anneeScolaireId: string, forceCapacite = false): Promise<{ ok: true; data: any } | { ok: false; code: string; message: string; meta?: any }> => {
    try {
      const r = await fetch(`${API_BASE_URL}/eleves/${eleveId}/reinscire`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ classeId, anneeScolaireId, forceCapacite }),
      });
      if (!r.ok) {
        const text = await r.text();
        let parsed: any = {};
        try { parsed = JSON.parse(text); } catch { parsed = { message: text }; }
        // Erreur métier avec code structuré
        try {
          const inner = JSON.parse(parsed.message || '');
          if (inner.code) return { ok: false, code: inner.code, message: parsed.message, meta: inner };
        } catch {}
        return { ok: false, code: 'ERROR', message: parsed.message || text };
      }
      notifyDataChange('eleves');
      return { ok: true, data: await r.json() };
    } catch (e: any) {
      return { ok: false, code: 'ERROR', message: e.message };
    }
  }, []);

  useEffect(() => {
    const u1 = onEvent('eleve:created', () => notifyDataChange('eleves'));
    const u2 = onEvent('eleve:updated', () => notifyDataChange('eleves'));
    return () => { u1(); u2(); };
  }, []);

  return <Ctx.Provider value={{ create, update, setStatut, reinscire }}>{children}</Ctx.Provider>;
}

export function useEleves() { const c = useContext(Ctx); if (!c) throw new Error('useEleves must be used within EleveProvider'); return c; }
