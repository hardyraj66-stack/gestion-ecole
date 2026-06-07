import { createContext, useContext, useEffect, useCallback, ReactNode } from 'react';
import { API_BASE_URL } from '../config/api';
import { onEvent, notifyDataChange } from '../services/socketService';

interface PeriodeContextType {
  updatePeriode: (id: string, data: { date_debut?: string | null; date_fin?: string | null }) => Promise<{ ok: boolean; message?: string }>;
  terminerPeriode: (id: string) => Promise<boolean>;
}

const Ctx = createContext<PeriodeContextType | undefined>(undefined);

export function PeriodeProvider({ children }: { children: ReactNode }) {
  const updatePeriode = useCallback(async (
    id: string,
    data: { date_debut?: string | null; date_fin?: string | null },
  ): Promise<{ ok: boolean; message?: string }> => {
    try {
      const r = await fetch(`${API_BASE_URL}/periodes/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (r.ok) return { ok: true };
      const body = await r.json().catch(() => ({}));
      return { ok: false, message: body?.message || 'Erreur lors de la mise à jour.' };
    } catch { return { ok: false, message: 'Erreur réseau.' }; }
  }, []);

  const terminerPeriode = useCallback(async (id: string): Promise<boolean> => {
    try {
      const r = await fetch(`${API_BASE_URL}/periodes/${id}/terminer`, { method: 'PATCH' });
      return r.ok;
    } catch { return false; }
  }, []);

  useEffect(() => {
    const unsub = onEvent('periode:updated', () => notifyDataChange('periodes'));
    return unsub;
  }, []);

  return <Ctx.Provider value={{ updatePeriode, terminerPeriode }}>{children}</Ctx.Provider>;
}

export function usePeriodes() {
  const c = useContext(Ctx);
  if (!c) throw new Error('usePeriodes must be used within PeriodeProvider');
  return c;
}
