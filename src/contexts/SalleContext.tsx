import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Salle, SalleDisponible } from '../types';
import { API_BASE_URL } from '../config/api';
import { onEvent, notifyDataChange } from '../services/socketService';

interface SalleContextType {
  salles: Salle[];
  loading: boolean;
  getAll: () => Promise<void>;
  getById: (id: string) => Salle | undefined;
  getDisponibles: (jour: string, hd: string, hf: string, excl?: string) => Promise<SalleDisponible[]>;
  create: (data: Omit<Salle, 'id'>, onSuccess?: () => void, onError?: (e: string) => void) => Promise<void>;
  update: (id: string, data: Partial<Salle>, onSuccess?: () => void, onError?: (e: string) => void) => Promise<void>;
  delete: (id: string, onError?: (e: string) => void) => Promise<void>;
}

const Ctx = createContext<SalleContextType | undefined>(undefined);

export function SalleProvider({ children }: { children: ReactNode }) {
  const [salles, setSalles] = useState<Salle[]>([]);
  const [loading, setLoading] = useState(false);

  const getAll = useCallback(async () => {
    try {
      setLoading(true);
      const r = await fetch(`${API_BASE_URL}/read/salles`);
      if (r.ok) { const d = await r.json(); setSalles(d?.items || d || []); }
      else setSalles([]);
    } catch { setSalles([]); }
    finally { setLoading(false); }
  }, []);

  const getById = useCallback((id: string) => salles.find(s => s.id === id), [salles]);

  const getDisponibles = useCallback(async (jour: string, hd: string, hf: string, excl?: string): Promise<SalleDisponible[]> => {
    try {
      let url = `${API_BASE_URL}/salles/disponibles?jour=${jour}&heure_debut=${hd}&heure_fin=${hf}`;
      if (excl) url += `&excludeCreneauId=${excl}`;
      const r = await fetch(url);
      if (r.ok) { const d = await r.json(); if (d?.length > 0) return d; }
    } catch {}
    return salles.map(s => ({ ...s, disponible: true, occupant: null }));
  }, [salles]);

  const create = useCallback(async (data: Omit<Salle, 'id'>, onSuccess?: () => void, onError?: (e: string) => void) => {
    try { const r = await fetch(`${API_BASE_URL}/salles`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }); if (r.ok) onSuccess?.(); else { const e = await r.json(); onError?.(e.message || 'Erreur'); } } catch { onError?.('Erreur de connexion'); }
  }, []);

  const update = useCallback(async (id: string, data: Partial<Salle>, onSuccess?: () => void, onError?: (e: string) => void) => {
    try { const r = await fetch(`${API_BASE_URL}/salles/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }); if (r.ok) onSuccess?.(); else { const e = await r.json(); onError?.(e.message || 'Erreur'); } } catch { onError?.('Erreur de connexion'); }
  }, []);

  const del = useCallback(async (id: string, onError?: (e: string) => void) => {
    try { const r = await fetch(`${API_BASE_URL}/salles/${id}`, { method: 'DELETE' }); if (!r.ok) { const e = await r.json(); onError?.(e.message || 'Erreur'); } } catch { onError?.('Erreur de connexion'); }
  }, []);

  useEffect(() => {
    const u1 = onEvent<Salle>('salle:created', () => { notifyDataChange(); getAll(); });
    const u2 = onEvent<Salle>('salle:updated', () => { notifyDataChange(); getAll(); });
    const u3 = onEvent<{ id: string }>('salle:deleted', () => { notifyDataChange(); getAll(); });
    return () => { u1(); u2(); u3(); };
  }, [getAll]);

  return <Ctx.Provider value={{ salles, loading, getAll, getById, getDisponibles, create, update, delete: del }}>{children}</Ctx.Provider>;
}

export function useSalles() { const c = useContext(Ctx); if (!c) throw new Error('useSalles must be used within SalleProvider'); return c; }
