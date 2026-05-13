import { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import { Eleve } from '../types';
import { API_BASE_URL } from '../config/api';
import { onEvent } from '../services/socketService';
import { mockEleves } from '../data/mockData';

interface EleveContextType {
  eleves: Eleve[];
  loading: boolean;
  count: number;
  getAll: () => Promise<void>;
  getById: (id: string) => Eleve | undefined;
  getByClasseId: (classeId: string) => Eleve[];
  create: (data: Omit<Eleve, 'id'>) => Promise<boolean>;
  update: (id: string, data: Partial<Eleve>) => Promise<void>;
  delete: (id: string) => Promise<void>;
}

const EleveContext = createContext<EleveContextType | undefined>(undefined);

export function EleveProvider({ children }: { children: ReactNode }) {
  const [eleves, setEleves] = useState<Eleve[]>([]);
  const [loading, setLoading] = useState(true);

  const getAll = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/eleves`);
      if (response.ok) {
        const data = await response.json();
        if (data && data.length > 0) {
          setEleves(data);
        } else {
          setEleves(mockEleves);
        }
      } else {
        setEleves(mockEleves);
      }
    } catch (error) {
      console.log('API unavailable, using mock data for eleves');
      setEleves(mockEleves);
    } finally {
      setLoading(false);
    }
  }, []);

  const getById = useCallback((id: string) => {
    return eleves.find(e => e.id === id);
  }, [eleves]);

  const getByClasseId = useCallback((classeId: string) => {
    return eleves.filter(e => e.classe_id === classeId);
  }, [eleves]);

  const create = useCallback(async (data: Omit<Eleve, 'id'>): Promise<boolean> => {
    try {
      const response = await fetch(`${API_BASE_URL}/eleves`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (response.ok) {
        const newEleve = await response.json();
        setEleves(prev => [...prev, newEleve]);
        return true;
      }
      return false;
    } catch (error) {
      // Mock creation
      const newEleve: Eleve = {
        ...data,
        id: `eleve-${Date.now()}`,
      };
      setEleves(prev => [...prev, newEleve]);
      return true;
    }
  }, []);

  const update = useCallback(async (id: string, data: Partial<Eleve>) => {
    try {
      const response = await fetch(`${API_BASE_URL}/eleves/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (response.ok) {
        const updatedEleve = await response.json();
        setEleves(prev => prev.map(e => e.id === id ? updatedEleve : e));
      }
    } catch (error) {
      setEleves(prev => prev.map(e => e.id === id ? { ...e, ...data } : e));
    }
  }, []);

  const deleteEleve = useCallback(async (id: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/eleves/${id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        setEleves(prev => prev.filter(e => e.id !== id));
      }
    } catch (error) {
      setEleves(prev => prev.filter(e => e.id !== id));
    }
  }, []);

  useEffect(() => {
    getAll();

    const unsubCreated = onEvent<Eleve>('eleve:created', (data) => {
      setEleves(prev => {
        if (prev.find(e => e.id === data.id)) return prev;
        return [...prev, data];
      });
    });

    const unsubUpdated = onEvent<Eleve>('eleve:updated', (data) => {
      setEleves(prev => prev.map(e => e.id === data.id ? data : e));
    });

    const unsubDeleted = onEvent<{ id: string }>('eleve:deleted', (data) => {
      setEleves(prev => prev.filter(e => e.id !== data.id));
    });

    return () => {
      unsubCreated();
      unsubUpdated();
      unsubDeleted();
    };
  }, [getAll]);

  const count = useMemo(() => eleves.length, [eleves]);

  const value: EleveContextType = {
    eleves,
    loading,
    count,
    getAll,
    getById,
    getByClasseId,
    create,
    update,
    delete: deleteEleve,
  };

  return (
    <EleveContext.Provider value={value}>
      {children}
    </EleveContext.Provider>
  );
}

export function useEleves() {
  const context = useContext(EleveContext);
  if (context === undefined) {
    throw new Error('useEleves must be used within an EleveProvider');
  }
  return context;
}
