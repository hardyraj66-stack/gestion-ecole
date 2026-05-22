import { createContext, useContext, useEffect, useCallback, ReactNode } from 'react';
import { API_BASE_URL } from '../config/api';
import { onEvent, notifyDataChange } from '../services/socketService';

interface ProfesseurContextType {
  create: (data: any, onSuccess?: () => void, onError?: (error: string) => void) => Promise<void>;
  update: (id: string, data: any, onSuccess?: () => void, onError?: (error: string) => void) => Promise<void>;
  desactiver: (id: string) => Promise<void>;
}

const ProfesseurContext = createContext<ProfesseurContextType | undefined>(undefined);

export function ProfesseurProvider({ children }: { children: ReactNode }) {
  const create = useCallback(async (data: any, onSuccess?: () => void, onError?: (error: string) => void) => {
    try {
      const res = await fetch(`${API_BASE_URL}/professeurs`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
      if (res.ok) { onSuccess?.(); } else { const e = await res.json(); onError?.(e.message || 'Erreur'); }
    } catch { onError?.('Erreur de connexion'); }
  }, []);

  const update = useCallback(async (id: string, data: any, onSuccess?: () => void, onError?: (error: string) => void) => {
    try {
      const res = await fetch(`${API_BASE_URL}/professeurs/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
      if (res.ok) { onSuccess?.(); } else { const e = await res.json(); onError?.(e.message || 'Erreur'); }
    } catch { onError?.('Erreur de connexion'); }
  }, []);

  const desactiver = useCallback(async (id: string) => {
    try { await fetch(`${API_BASE_URL}/professeurs/${id}/desactiver`, { method: 'PATCH' }); } catch {}
  }, []);

  useEffect(() => {
    const unsub = onEvent('professeur:event', () => notifyDataChange('professeurs'));
    return () => { unsub(); };
  }, []);

  return (
    <ProfesseurContext.Provider value={{ create, update, desactiver }}>
      {children}
    </ProfesseurContext.Provider>
  );
}

export function useProfesseurs() {
  const ctx = useContext(ProfesseurContext);
  if (!ctx) throw new Error('useProfesseurs must be used within ProfesseurProvider');
  return ctx;
}
