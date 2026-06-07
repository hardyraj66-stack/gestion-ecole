import { createContext, useContext, useEffect, useCallback, ReactNode } from 'react';
import { API_BASE_URL } from '../config/api';
import { onEvent, notifyDataChange } from '../services/socketService';

interface TeacherAssignmentContextType {
  create: (data: any, onSuccess?: () => void, onError?: (error: string) => void) => Promise<void>;
  update: (id: string, data: any, onSuccess?: () => void, onError?: (error: string) => void) => Promise<void>;
  delete: (id: string) => Promise<void>;
  resolve: (classeId: string, matiereId: string) => Promise<{ professeur_id: string | null; professeur_nom?: string; professeur_prenom?: string } | null>;
}

const TeacherAssignmentContext = createContext<TeacherAssignmentContextType | undefined>(undefined);

export function TeacherAssignmentProvider({ children }: { children: ReactNode }) {
  const create = useCallback(async (data: any, onSuccess?: () => void, onError?: (error: string) => void) => {
    try {
      const res = await fetch(`${API_BASE_URL}/teacher-assignments`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
      if (res.ok) { onSuccess?.(); } else { const e = await res.json(); onError?.(e.message || 'Erreur'); }
    } catch { onError?.('Erreur de connexion'); }
  }, []);

  const update = useCallback(async (id: string, data: any, onSuccess?: () => void, onError?: (error: string) => void) => {
    try {
      const res = await fetch(`${API_BASE_URL}/teacher-assignments/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
      if (res.ok) { onSuccess?.(); } else { const e = await res.json(); onError?.(e.message || 'Erreur'); }
    } catch { onError?.('Erreur de connexion'); }
  }, []);

  const del = useCallback(async (id: string) => {
    try { await fetch(`${API_BASE_URL}/teacher-assignments/${id}`, { method: 'DELETE' }); } catch {}
  }, []);

  const resolve = useCallback(async (classeId: string, matiereId: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/teacher-assignments/resolve?classe_id=${classeId}&matiere_id=${matiereId}`);
      if (res.ok) return res.json();
      return null;
    } catch { return null; }
  }, []);

  useEffect(() => {
    const unsub = onEvent('assignment:event', () => notifyDataChange('planning'));
    return () => { unsub(); };
  }, []);

  return (
    <TeacherAssignmentContext.Provider value={{ create, update, delete: del, resolve }}>
      {children}
    </TeacherAssignmentContext.Provider>
  );
}

export function useTeacherAssignments() {
  const ctx = useContext(TeacherAssignmentContext);
  if (!ctx) throw new Error('useTeacherAssignments must be used within TeacherAssignmentProvider');
  return ctx;
}
