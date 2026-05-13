import { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import { Creneau } from '../types';
import { API_BASE_URL } from '../config/api';
import { onEvent } from '../services/socketService';
import { mockCreneaux } from '../data/mockData';

interface PlanningContextType {
  creneaux: Creneau[];
  loading: boolean;
  count: number;
  getAll: () => Promise<void>;
  getById: (id: string) => Creneau | undefined;
  getByClasseId: (classeId: string) => Creneau[];
  create: (data: Omit<Creneau, 'id'>) => Promise<boolean>;
  createWithError: (data: Omit<Creneau, 'id'>, onSuccess?: () => void, onError?: (error: string) => void) => Promise<void>;
  update: (id: string, data: Partial<Creneau>) => Promise<void>;
  delete: (id: string) => Promise<void>;
}

const PlanningContext = createContext<PlanningContextType | undefined>(undefined);

export function PlanningProvider({ children }: { children: ReactNode }) {
  const [creneaux, setCreneaux] = useState<Creneau[]>([]);
  const [loading, setLoading] = useState(true);

  const getAll = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/planning`);
      if (response.ok) {
        const data = await response.json();
        if (data && data.length > 0) {
          setCreneaux(data);
        } else {
          setCreneaux(mockCreneaux);
        }
      } else {
        setCreneaux(mockCreneaux);
      }
    } catch (error) {
      console.log('API unavailable, using mock data for planning');
      setCreneaux(mockCreneaux);
    } finally {
      setLoading(false);
    }
  }, []);

  const getById = useCallback((id: string) => {
    return creneaux.find(c => c.id === id);
  }, [creneaux]);

  const getByClasseId = useCallback((classeId: string) => {
    return creneaux.filter(c => c.classe_id === classeId);
  }, [creneaux]);

  const create = useCallback(async (data: Omit<Creneau, 'id'>): Promise<boolean> => {
    try {
      const response = await fetch(`${API_BASE_URL}/planning`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (response.ok) {
        const newCreneau = await response.json();
        setCreneaux(prev => [...prev, newCreneau]);
        return true;
      }
      return false;
    } catch (error) {
      const newCreneau: Creneau = {
        ...data,
        id: `creneau-${Date.now()}`,
      };
      setCreneaux(prev => [...prev, newCreneau]);
      return true;
    }
  }, []);

  const createWithError = useCallback(async (
    data: Omit<Creneau, 'id'>,
    onSuccess?: () => void,
    onError?: (error: string) => void
  ) => {
    try {
      const response = await fetch(`${API_BASE_URL}/planning`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (response.ok) {
        const newCreneau = await response.json();
        setCreneaux(prev => [...prev, newCreneau]);
        onSuccess?.();
      } else {
        const errorData = await response.json();
        onError?.(errorData.message || 'Erreur lors de la création du créneau');
      }
    } catch (error) {
      // Mock creation when API is unavailable
      const newCreneau: Creneau = {
        ...data,
        id: `creneau-${Date.now()}`,
      };
      setCreneaux(prev => [...prev, newCreneau]);
      onSuccess?.();
    }
  }, []);

  const update = useCallback(async (id: string, data: Partial<Creneau>) => {
    try {
      const response = await fetch(`${API_BASE_URL}/planning/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (response.ok) {
        const updatedCreneau = await response.json();
        setCreneaux(prev => prev.map(c => c.id === id ? updatedCreneau : c));
      }
    } catch (error) {
      setCreneaux(prev => prev.map(c => c.id === id ? { ...c, ...data } as Creneau : c));
    }
  }, []);

  const deleteCreneau = useCallback(async (id: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/planning/${id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        setCreneaux(prev => prev.filter(c => c.id !== id));
      }
    } catch (error) {
      setCreneaux(prev => prev.filter(c => c.id !== id));
    }
  }, []);

  useEffect(() => {
    getAll();

    const unsubCreated = onEvent<Creneau>('creneau:created', (data) => {
      setCreneaux(prev => {
        if (prev.find(c => c.id === data.id)) return prev;
        return [...prev, data];
      });
    });

    const unsubUpdated = onEvent<Creneau>('creneau:updated', (data) => {
      setCreneaux(prev => prev.map(c => c.id === data.id ? data : c));
    });

    const unsubDeleted = onEvent<{ id: string }>('creneau:deleted', (data) => {
      setCreneaux(prev => prev.filter(c => c.id !== data.id));
    });

    return () => {
      unsubCreated();
      unsubUpdated();
      unsubDeleted();
    };
  }, [getAll]);

  const count = useMemo(() => creneaux.length, [creneaux]);

  const value: PlanningContextType = {
    creneaux,
    loading,
    count,
    getAll,
    getById,
    getByClasseId,
    create,
    createWithError,
    update,
    delete: deleteCreneau,
  };

  return (
    <PlanningContext.Provider value={value}>
      {children}
    </PlanningContext.Provider>
  );
}

export function usePlanning() {
  const context = useContext(PlanningContext);
  if (context === undefined) {
    throw new Error('usePlanning must be used within a PlanningProvider');
  }
  return context;
}
