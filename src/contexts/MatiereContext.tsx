import { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import { Matiere } from '../types';
import { API_BASE_URL } from '../config/api';
import { onEvent } from '../services/socketService';
import { mockMatieres } from '../data/mockData';

interface MatiereContextType {
  matieres: Matiere[];
  loading: boolean;
  count: number;
  getAll: () => Promise<void>;
  getById: (id: string) => Matiere | undefined;
  create: (data: Omit<Matiere, 'id'>) => Promise<boolean>;
  update: (id: string, data: Partial<Matiere>) => Promise<void>;
  delete: (id: string) => Promise<void>;
}

const MatiereContext = createContext<MatiereContextType | undefined>(undefined);

export function MatiereProvider({ children }: { children: ReactNode }) {
  const [matieres, setMatieres] = useState<Matiere[]>([]);
  const [loading, setLoading] = useState(true);

  const getAll = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/matieres`);
      if (response.ok) {
        const data = await response.json();
        if (data && data.length > 0) {
          setMatieres(data);
        } else {
          setMatieres(mockMatieres);
        }
      } else {
        setMatieres(mockMatieres);
      }
    } catch (error) {
      console.log('API unavailable, using mock data for matieres');
      setMatieres(mockMatieres);
    } finally {
      setLoading(false);
    }
  }, []);

  const getById = useCallback((id: string) => {
    return matieres.find(m => m.id === id);
  }, [matieres]);

  const create = useCallback(async (data: Omit<Matiere, 'id'>): Promise<boolean> => {
    try {
      const response = await fetch(`${API_BASE_URL}/matieres`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (response.ok) {
        const newMatiere = await response.json();
        setMatieres(prev => [...prev, newMatiere]);
        return true;
      }
      return false;
    } catch (error) {
      const newMatiere: Matiere = {
        ...data,
        id: `mat-${Date.now()}`,
      };
      setMatieres(prev => [...prev, newMatiere]);
      return true;
    }
  }, []);

  const update = useCallback(async (id: string, data: Partial<Matiere>) => {
    try {
      const response = await fetch(`${API_BASE_URL}/matieres/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (response.ok) {
        const updatedMatiere = await response.json();
        setMatieres(prev => prev.map(m => m.id === id ? updatedMatiere : m));
      }
    } catch (error) {
      setMatieres(prev => prev.map(m => m.id === id ? { ...m, ...data } : m));
    }
  }, []);

  const deleteMatiere = useCallback(async (id: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/matieres/${id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        setMatieres(prev => prev.filter(m => m.id !== id));
      }
    } catch (error) {
      setMatieres(prev => prev.filter(m => m.id !== id));
    }
  }, []);

  useEffect(() => {
    getAll();

    const unsubCreated = onEvent<Matiere>('matiere:created', (data) => {
      setMatieres(prev => {
        if (prev.find(m => m.id === data.id)) return prev;
        return [...prev, data];
      });
    });

    const unsubUpdated = onEvent<Matiere>('matiere:updated', (data) => {
      setMatieres(prev => prev.map(m => m.id === data.id ? data : m));
    });

    const unsubDeleted = onEvent<{ id: string }>('matiere:deleted', (data) => {
      setMatieres(prev => prev.filter(m => m.id !== data.id));
    });

    return () => {
      unsubCreated();
      unsubUpdated();
      unsubDeleted();
    };
  }, [getAll]);

  const count = useMemo(() => matieres.length, [matieres]);

  const value: MatiereContextType = {
    matieres,
    loading,
    count,
    getAll,
    getById,
    create,
    update,
    delete: deleteMatiere,
  };

  return (
    <MatiereContext.Provider value={value}>
      {children}
    </MatiereContext.Provider>
  );
}

export function useMatieres() {
  const context = useContext(MatiereContext);
  if (context === undefined) {
    throw new Error('useMatieres must be used within a MatiereProvider');
  }
  return context;
}
