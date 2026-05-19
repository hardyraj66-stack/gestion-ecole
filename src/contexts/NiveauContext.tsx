import { createContext, useContext, useEffect, useCallback, ReactNode } from 'react';
import { API_BASE_URL } from '../config/api';
import { onEvent, notifyDataChange } from '../services/socketService';

export interface Niveau {
  id: string;
  nom: string;
  ordre: number;
  description: string;
  matiere_ids: string[];
}

interface NiveauContextType {
  create: (data: Omit<Niveau, 'id'>) => Promise<{ ok: boolean; error?: string }>;
  update: (id: string, data: Partial<Omit<Niveau, 'id'>>) => Promise<{ ok: boolean; error?: string }>;
  delete: (id: string) => Promise<boolean>;
}

const Ctx = createContext<NiveauContextType | undefined>(undefined);

export function NiveauProvider({ children }: { children: ReactNode }) {
  const create = useCallback(async (data: Omit<Niveau, 'id'>): Promise<{ ok: boolean; error?: string }> => {
    try {
      const r = await fetch(`${API_BASE_URL}/niveaux`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!r.ok) {
        const body = await r.json().catch(() => ({}));
        return { ok: false, error: body.message || 'Erreur lors de la création' };
      }
      notifyDataChange('niveaux');
      return { ok: true };
    } catch {
      return { ok: false, error: 'Erreur réseau' };
    }
  }, []);

  const update = useCallback(async (id: string, data: Partial<Omit<Niveau, 'id'>>): Promise<{ ok: boolean; error?: string }> => {
    try {
      const r = await fetch(`${API_BASE_URL}/niveaux/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!r.ok) {
        const body = await r.json().catch(() => ({}));
        return { ok: false, error: body.message || 'Erreur lors de la modification' };
      }
      notifyDataChange('niveaux');
      return { ok: true };
    } catch {
      return { ok: false, error: 'Erreur réseau' };
    }
  }, []);

  const del = useCallback(async (id: string): Promise<boolean> => {
    try {
      const r = await fetch(`${API_BASE_URL}/niveaux/${id}`, { method: 'DELETE' });
      if (r.ok) notifyDataChange('niveaux');
      return r.ok;
    } catch {
      return false;
    }
  }, []);

  useEffect(() => {
    const u1 = onEvent('niveau:created', () => notifyDataChange('niveaux'));
    const u2 = onEvent('niveau:updated', () => notifyDataChange('niveaux'));
    const u3 = onEvent('niveau:deleted', () => notifyDataChange('niveaux'));
    return () => { u1(); u2(); u3(); };
  }, []);

  return <Ctx.Provider value={{ create, update, delete: del }}>{children}</Ctx.Provider>;
}

export function useNiveaux() {
  const c = useContext(Ctx);
  if (!c) throw new Error('useNiveaux must be used within NiveauProvider');
  return c;
}
