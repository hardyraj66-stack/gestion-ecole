import { createContext, useContext, useEffect, useCallback, ReactNode } from 'react';
import { Classe } from '../types';
import { API_BASE_URL } from '../config/api';
import { onEvent, notifyDataChange } from '../services/socketService';

interface ClasseContextType {
  create: (data: Omit<Classe, 'id'>, onSuccess?: () => void, onError?: (error: string) => void) => Promise<void>;
  update: (id: string, data: Partial<Classe>) => Promise<void>;
  delete: (id: string) => Promise<void>;
}

const ClasseContext = createContext<ClasseContextType | undefined>(undefined);

export function ClasseProvider({ children }: { children: ReactNode }) {

  const create = useCallback(async (data: Omit<Classe, 'id'>, onSuccess?: () => void, onError?: (error: string) => void) => {
    try {
      const res = await fetch(`${API_BASE_URL}/classes`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
      if (res.ok) { onSuccess?.(); } else { const e = await res.json(); onError?.(e.message || 'Erreur'); }
    } catch { onError?.('Erreur de connexion'); }
  }, []);

  const update = useCallback(async (id: string, data: Partial<Classe>) => {
    try { await fetch(`${API_BASE_URL}/classes/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }); } catch {}
  }, []);

  const del = useCallback(async (id: string) => {
    try { await fetch(`${API_BASE_URL}/classes/${id}`, { method: 'DELETE' }); } catch {}
  }, []);

  // Écoute les sockets et notifie les pages de re-fetcher
  useEffect(() => {
    const u1 = onEvent('classe:created', () => notifyDataChange());
    const u2 = onEvent('classe:updated', () => notifyDataChange());
    const u3 = onEvent('classe:deleted', () => notifyDataChange());
    return () => { u1(); u2(); u3(); };
  }, []);

  return (
    <ClasseContext.Provider value={{ create, update, delete: del }}>
      {children}
    </ClasseContext.Provider>
  );
}

export function useClasses() {
  const ctx = useContext(ClasseContext);
  if (!ctx) throw new Error('useClasses must be used within ClasseProvider');
  return ctx;
}
