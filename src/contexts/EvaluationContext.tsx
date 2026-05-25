import { createContext, useContext, useEffect, useCallback, ReactNode } from 'react';
import { NoteEvaluation } from '../types';
import { API_BASE_URL } from '../config/api';
import { onEvent, notifyDataChange } from '../services/socketService';

interface CreateEvaluationDto {
  type: 'ds' | 'evaluation';
  classe_id: string;
  matiere_id: string;
  trimestre: 1 | 2 | 3;
  annee_scolaire: string;
  date: string;
}

interface EvaluationContextType {
  create: (data: CreateEvaluationDto) => Promise<{ id: string } | null>;
  saisirNotes: (id: string, notes: NoteEvaluation[]) => Promise<boolean>;
  publier: (id: string) => Promise<boolean>;
  deleteEvaluation: (id: string) => Promise<boolean>;
}

const Ctx = createContext<EvaluationContextType | undefined>(undefined);

export function EvaluationProvider({ children }: { children: ReactNode }) {
  const create = useCallback(async (data: CreateEvaluationDto): Promise<{ id: string } | null> => {
    try {
      const r = await fetch(`${API_BASE_URL}/evaluations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (r.ok) return r.json();
      return null;
    } catch { return null; }
  }, []);

  const saisirNotes = useCallback(async (id: string, notes: NoteEvaluation[]): Promise<boolean> => {
    try {
      const r = await fetch(`${API_BASE_URL}/evaluations/${id}/notes`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes }),
      });
      return r.ok;
    } catch { return false; }
  }, []);

  const publier = useCallback(async (id: string): Promise<boolean> => {
    try {
      const r = await fetch(`${API_BASE_URL}/evaluations/${id}/publier`, { method: 'PATCH' });
      return r.ok;
    } catch { return false; }
  }, []);

  const deleteEvaluation = useCallback(async (id: string): Promise<boolean> => {
    try {
      const r = await fetch(`${API_BASE_URL}/evaluations/${id}`, { method: 'DELETE' });
      return r.ok;
    } catch { return false; }
  }, []);

  useEffect(() => {
    const u1 = onEvent('evaluation:created', () => notifyDataChange('evaluations'));
    const u2 = onEvent('evaluation:updated', () => notifyDataChange('evaluations'));
    const u3 = onEvent('evaluation:publie', () => {
      notifyDataChange('evaluations');
      notifyDataChange('notes');
    });
    const u4 = onEvent('evaluation:deleted', () => notifyDataChange('evaluations'));
    return () => { u1(); u2(); u3(); u4(); };
  }, []);

  return <Ctx.Provider value={{ create, saisirNotes, publier, deleteEvaluation }}>{children}</Ctx.Provider>;
}

export function useEvaluations() {
  const c = useContext(Ctx);
  if (!c) throw new Error('useEvaluations must be used within EvaluationProvider');
  return c;
}
