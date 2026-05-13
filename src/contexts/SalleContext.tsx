import { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import { Salle, SalleDisponible } from '../types';
import { API_BASE_URL } from '../config/api';
import { onEvent } from '../services/socketService';
import { mockSalles } from '../data/mockData';

interface SalleContextType {
  salles: Salle[];
  loading: boolean;
  count: number;
  getAll: () => Promise<void>;
  getById: (id: string) => Salle | undefined;
  getByNom: (nom: string) => Salle | undefined;
  getDisponibles: (jour: string, heure_debut: string, heure_fin: string, excludeCreneauId?: string) => Promise<SalleDisponible[]>;
  create: (data: Omit<Salle, 'id'>, onSuccess?: () => void, onError?: (error: string) => void) => Promise<void>;
  update: (id: string, data: Partial<Salle>, onSuccess?: () => void, onError?: (error: string) => void) => Promise<void>;
  delete: (id: string, onError?: (error: string) => void) => Promise<void>;
}

const SalleContext = createContext<SalleContextType | undefined>(undefined);

export function SalleProvider({ children }: { children: ReactNode }) {
  const [salles, setSalles] = useState<Salle[]>([]);
  const [loading, setLoading] = useState(true);

  const getAll = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/salles`);
      if (response.ok) {
        const data = await response.json();
        if (data && data.length > 0) {
          setSalles(data);
        } else {
          setSalles(mockSalles);
        }
      } else {
        setSalles(mockSalles);
      }
    } catch (error) {
      console.log('API unavailable, using mock data for salles');
      setSalles(mockSalles);
    } finally {
      setLoading(false);
    }
  }, []);

  const getById = useCallback((id: string) => {
    return salles.find(s => s.id === id);
  }, [salles]);

  const getByNom = useCallback((nom: string) => {
    return salles.find(s => s.nom === nom);
  }, [salles]);

  const getDisponibles = useCallback(async (
    jour: string,
    heure_debut: string,
    heure_fin: string,
    excludeCreneauId?: string
  ): Promise<SalleDisponible[]> => {
    try {
      let url = `${API_BASE_URL}/salles/disponibles?jour=${jour}&heure_debut=${heure_debut}&heure_fin=${heure_fin}`;
      if (excludeCreneauId) {
        url += `&excludeCreneauId=${excludeCreneauId}`;
      }
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        if (data && data.length > 0) {
          return data;
        }
      }
    } catch (error) {
      console.log('API unavailable, using mock disponibles');
    }
    
    // Mock disponibles - all salles available
    return salles.map(s => ({
      ...s,
      disponible: true,
      occupant: null,
    }));
  }, [salles]);

  const create = useCallback(async (
    data: Omit<Salle, 'id'>,
    onSuccess?: () => void,
    onError?: (error: string) => void
  ) => {
    try {
      const response = await fetch(`${API_BASE_URL}/salles`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (response.ok) {
        onSuccess?.();
      } else {
        const errorData = await response.json();
        onError?.(errorData.message || 'Erreur lors de la création');
      }
    } catch (error) {
      // Mock creation
      const newSalle: Salle = {
        ...data,
        id: `salle-${Date.now()}`,
      };
      setSalles(prev => [...prev, newSalle]);
      onSuccess?.();
    }
  }, []);

  const update = useCallback(async (
    id: string,
    data: Partial<Salle>,
    onSuccess?: () => void,
    onError?: (error: string) => void
  ) => {
    try {
      const response = await fetch(`${API_BASE_URL}/salles/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (response.ok) {
        onSuccess?.();
      } else {
        const errorData = await response.json();
        onError?.(errorData.message || 'Erreur lors de la mise à jour');
      }
    } catch (error) {
      setSalles(prev => prev.map(s => s.id === id ? { ...s, ...data } : s));
      onSuccess?.();
    }
  }, []);

  const deleteSalle = useCallback(async (id: string, onError?: (error: string) => void) => {
    try {
      const response = await fetch(`${API_BASE_URL}/salles/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const errorData = await response.json();
        onError?.(errorData.message || 'Erreur lors de la suppression');
      }
    } catch (error) {
      setSalles(prev => prev.filter(s => s.id !== id));
    }
  }, []);

  useEffect(() => {
    getAll();

    const unsubCreated = onEvent<Salle>('salle:created', (data) => {
      setSalles(prev => {
        if (prev.find(s => s.id === data.id)) return prev;
        return [...prev, data];
      });
    });

    const unsubUpdated = onEvent<Salle>('salle:updated', (data) => {
      setSalles(prev => prev.map(s => s.id === data.id ? data : s));
    });

    const unsubDeleted = onEvent<{ id: string }>('salle:deleted', (data) => {
      setSalles(prev => prev.filter(s => s.id !== data.id));
    });

    return () => {
      unsubCreated();
      unsubUpdated();
      unsubDeleted();
    };
  }, [getAll]);

  const count = useMemo(() => salles.length, [salles]);

  const value: SalleContextType = {
    salles,
    loading,
    count,
    getAll,
    getById,
    getByNom,
    getDisponibles,
    create,
    update,
    delete: deleteSalle,
  };

  return (
    <SalleContext.Provider value={value}>
      {children}
    </SalleContext.Provider>
  );
}

export function useSalles() {
  const context = useContext(SalleContext);
  if (context === undefined) {
    throw new Error('useSalles must be used within a SalleProvider');
  }
  return context;
}
