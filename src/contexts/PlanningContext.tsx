import { createContext, useContext, useEffect, useCallback, ReactNode } from 'react';
import { Creneau } from '../types';
import { API_BASE_URL } from '../config/api';
import { onEvent, notifyDataChange } from '../services/socketService';

interface PlanningContextType {
  create: (data: Omit<Creneau, 'id'>) => Promise<boolean>;
  createWithError: (data: Omit<Creneau, 'id'>, onSuccess?: () => void, onError?: (e: string) => void) => Promise<void>;
  update: (id: string, data: Partial<Creneau>) => Promise<void>;
  delete: (id: string) => Promise<void>;
}

const Ctx = createContext<PlanningContextType | undefined>(undefined);

export function PlanningProvider({ children }: { children: ReactNode }) {
  const create = useCallback(async (data: Omit<Creneau, 'id'>): Promise<boolean> => {
    try { const r = await fetch(`${API_BASE_URL}/planning`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }); return r.ok; } catch { return false; }
  }, []);

  const createWithError = useCallback(async (data: Omit<Creneau, 'id'>, onSuccess?: () => void, onError?: (e: string) => void) => {
    try { const r = await fetch(`${API_BASE_URL}/planning`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }); if (r.ok) { onSuccess?.(); } else { const e = await r.json(); onError?.(e.message || 'Erreur'); } }
    catch { onError?.('Erreur de connexion'); }
  }, []);

  const update = useCallback(async (id: string, data: Partial<Creneau>) => {
    try { await fetch(`${API_BASE_URL}/planning/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }); } catch {}
  }, []);

  const del = useCallback(async (id: string) => {
    try { await fetch(`${API_BASE_URL}/planning/${id}`, { method: 'DELETE' }); } catch {}
  }, []);

  useEffect(() => {
    const u1 = onEvent('creneau:created', () => notifyDataChange());
    const u2 = onEvent('creneau:updated', () => notifyDataChange());
    const u3 = onEvent('creneau:deleted', () => notifyDataChange());
    return () => { u1(); u2(); u3(); };
  }, []);

  return <Ctx.Provider value={{ create, createWithError, update, delete: del }}>{children}</Ctx.Provider>;
}

export function usePlanning() { const c = useContext(Ctx); if (!c) throw new Error('usePlanning must be used within PlanningProvider'); return c; }
