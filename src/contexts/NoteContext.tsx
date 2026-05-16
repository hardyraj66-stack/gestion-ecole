import { createContext, useContext, useEffect, useCallback, ReactNode } from 'react';
import { Note, Trimestre, BulletinMatiere } from '../types';
import { API_BASE_URL } from '../config/api';
import { onEvent, notifyDataChange } from '../services/socketService';

interface NoteContextType {
  create: (data: Omit<Note, 'id'>) => Promise<boolean>;
  update: (id: string, data: Partial<Note>) => Promise<boolean>;
  delete: (id: string) => Promise<void>;
  getBulletinFromApi: (eleveId: string, trimestre: Trimestre) => Promise<BulletinMatiere[]>;
  getMoyenneGenerale: (bm: BulletinMatiere[]) => number;
}

const Ctx = createContext<NoteContextType | undefined>(undefined);

export function NoteProvider({ children }: { children: ReactNode }) {
  const create = useCallback(async (data: Omit<Note, 'id'>): Promise<boolean> => {
    try { const r = await fetch(`${API_BASE_URL}/notes`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }); return r.ok; } catch { return false; }
  }, []);

  const update = useCallback(async (id: string, data: Partial<Note>): Promise<boolean> => {
    try { const r = await fetch(`${API_BASE_URL}/notes/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }); return r.ok; } catch { return false; }
  }, []);

  const del = useCallback(async (id: string) => {
    try { await fetch(`${API_BASE_URL}/notes/${id}`, { method: 'DELETE' }); } catch {}
  }, []);

  const getBulletinFromApi = useCallback(async (eleveId: string, trimestre: Trimestre): Promise<BulletinMatiere[]> => {
    try {
      const r = await fetch(`${API_BASE_URL}/read/bulletin/${eleveId}?trimestre=${trimestre}`);
      if (r.ok) { const d = await r.json(); return d?.bulletin || []; }
    } catch {}
    return [];
  }, []);

  const getMoyenneGenerale = useCallback((bm: BulletinMatiere[]): number => {
    if (!bm.length) return 0;
    let tc = 0, s = 0;
    for (const m of bm) { if (m.notes.length > 0) { s += m.moyenne * m.coefficient; tc += m.coefficient; } }
    return tc === 0 ? 0 : Math.round((s / tc) * 10) / 10;
  }, []);

  useEffect(() => {
    const u1 = onEvent('note:created', () => notifyDataChange());
    const u2 = onEvent('note:updated', () => notifyDataChange());
    const u3 = onEvent('note:deleted', () => notifyDataChange());
    return () => { u1(); u2(); u3(); };
  }, []);

  return <Ctx.Provider value={{ create, update, delete: del, getBulletinFromApi, getMoyenneGenerale }}>{children}</Ctx.Provider>;
}

export function useNotes() { const c = useContext(Ctx); if (!c) throw new Error('useNotes must be used within NoteProvider'); return c; }
