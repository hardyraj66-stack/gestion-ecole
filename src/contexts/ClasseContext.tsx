import { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import { Classe } from '../types';
import { API_BASE_URL } from '../config/api';
import { onEvent } from '../services/socketService';
import { mockClasses } from '../data/mockData';

interface ClasseContextType {
  classes: Classe[];
  loading: boolean;
  count: number;
  getAll: () => Promise<void>;
  getById: (id: string) => Classe | undefined;
  create: (data: Omit<Classe, 'id'>, onSuccess?: () => void, onError?: (error: string) => void) => Promise<void>;
  update: (id: string, data: Partial<Classe>) => Promise<void>;
  delete: (id: string) => Promise<void>;
}

const ClasseContext = createContext<ClasseContextType | undefined>(undefined);

export function ClasseProvider({ children }: { children: ReactNode }) {
  const [classes, setClasses] = useState<Classe[]>([]);
  const [loading, setLoading] = useState(true);

  const getAll = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/classes`);
      if (response.ok) {
        const data = await response.json();
        if (data && data.length > 0) {
          setClasses(data);
        } else {
          // Fallback to mock data if API returns empty
          setClasses(mockClasses);
        }
      } else {
        // Fallback to mock data if API fails
        setClasses(mockClasses);
      }
    } catch (error) {
      console.log('API unavailable, using mock data for classes');
      setClasses(mockClasses);
    } finally {
      setLoading(false);
    }
  }, []);

  const getById = useCallback((id: string) => {
    return classes.find(c => c.id === id);
  }, [classes]);

  const create = useCallback(async (
    data: Omit<Classe, 'id'>,
    onSuccess?: () => void,
    onError?: (error: string) => void
  ) => {
    try {
      const response = await fetch(`${API_BASE_URL}/classes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (response.ok) {
        const newClasse = await response.json();
        setClasses(prev => [...prev, newClasse]);
        onSuccess?.();
      } else {
        const errorData = await response.json();
        onError?.(errorData.message || 'Erreur lors de la création');
      }
    } catch (error) {
      // Mock creation when API is unavailable
      const newClasse: Classe = {
        ...data,
        id: `classe-${Date.now()}`,
      };
      setClasses(prev => [...prev, newClasse]);
      onSuccess?.();
    }
  }, []);

  const update = useCallback(async (id: string, data: Partial<Classe>) => {
    try {
      const response = await fetch(`${API_BASE_URL}/classes/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (response.ok) {
        const updatedClasse = await response.json();
        setClasses(prev => prev.map(c => c.id === id ? updatedClasse : c));
      }
    } catch (error) {
      // Mock update when API is unavailable
      setClasses(prev => prev.map(c => c.id === id ? { ...c, ...data } : c));
    }
  }, []);

  const deleteClasse = useCallback(async (id: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/classes/${id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        setClasses(prev => prev.filter(c => c.id !== id));
      }
    } catch (error) {
      // Mock delete when API is unavailable
      setClasses(prev => prev.filter(c => c.id !== id));
    }
  }, []);

  useEffect(() => {
    getAll();

    const unsubCreated = onEvent<Classe>('classe:created', (data) => {
      setClasses(prev => {
        if (prev.find(c => c.id === data.id)) return prev;
        return [...prev, data];
      });
    });

    const unsubUpdated = onEvent<Classe>('classe:updated', (data) => {
      setClasses(prev => prev.map(c => c.id === data.id ? data : c));
    });

    const unsubDeleted = onEvent<{ id: string }>('classe:deleted', (data) => {
      setClasses(prev => prev.filter(c => c.id !== data.id));
    });

    return () => {
      unsubCreated();
      unsubUpdated();
      unsubDeleted();
    };
  }, [getAll]);

  const count = useMemo(() => classes.length, [classes]);

  const value: ClasseContextType = {
    classes,
    loading,
    count,
    getAll,
    getById,
    create,
    update,
    delete: deleteClasse,
  };

  return (
    <ClasseContext.Provider value={value}>
      {children}
    </ClasseContext.Provider>
  );
}

export function useClasses() {
  const context = useContext(ClasseContext);
  if (context === undefined) {
    throw new Error('useClasses must be used within a ClasseProvider');
  }
  return context;
}
