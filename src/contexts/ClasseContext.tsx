import { createContext, useContext, useEffect, useCallback, ReactNode } from 'react';
import { Classe } from '../types';
import { API_BASE_URL } from '../config/api';
import { onEvent, notifyDataChange } from '../services/socketService';

interface ClasseContextType {
  create: (data: Omit<Classe, 'id' | 'annee_scolaire'>, onSuccess?: () => void, onError?: (error: string) => void) => Promise<void>;
  update: (id: string, data: Partial<Classe>, onSuccess?: () => void, onError?: (error: string) => void) => Promise<void>;
  desactiver: (id: string, onError?: (error: string) => void) => Promise<void>;
}

const ClasseContext = createContext<ClasseContextType | undefined>(undefined);

export function ClasseProvider({ children }: { children: ReactNode }) {

  const create = useCallback(async (data: Omit<Classe, 'id' | 'annee_scolaire'>, onSuccess?: () => void, onError?: (error: string) => void) => {
    try {
      const res = await fetch(`${API_BASE_URL}/classes`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
      if (res.ok) { onSuccess?.(); } else { const e = await res.json(); onError?.(e.message || 'Erreur'); }
    } catch (e) { console.error('ClasseContext.create', e); onError?.('Erreur de connexion'); }
  }, []);

  const update = useCallback(async (id: string, data: Partial<Classe>, onSuccess?: () => void, onError?: (error: string) => void) => {
    try {
      const res = await fetch(`${API_BASE_URL}/classes/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
      if (res.ok) { onSuccess?.(); } else { const e = await res.json(); onError?.(e.message || 'Erreur'); }
    } catch (e) { console.error('ClasseContext.update', e); onError?.('Erreur de connexion'); }
  }, []);

  const desactiver = useCallback(async (id: string, onError?: (error: string) => void) => {
    try {
      const res = await fetch(`${API_BASE_URL}/classes/${id}/desactiver`, { method: 'PATCH' });
      if (!res.ok) { const e = await res.json(); onError?.(e.message || 'Erreur'); }
    } catch (e) { console.error('ClasseContext.desactiver', e); onError?.('Erreur de connexion'); }
  }, []);

  useEffect(() => {
    const u1 = onEvent('classe:created', () => notifyDataChange('classes'));
    const u2 = onEvent('classe:updated', () => notifyDataChange('classes'));
    return () => { u1(); u2(); };
  }, []);

  return (
    <ClasseContext.Provider value={{ create, update, desactiver }}>
      {children}
    </ClasseContext.Provider>
  );
}

export function useClasses() {
  const ctx = useContext(ClasseContext);
  if (!ctx) throw new Error('useClasses must be used within ClasseProvider');
  return ctx;
}
