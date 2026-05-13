import { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import { Note, Trimestre, BulletinMatiere } from '../types';
import { API_BASE_URL } from '../config/api';
import { onEvent } from '../services/socketService';
import { mockNotes, generateMockBulletin } from '../data/mockData';

interface NoteContextType {
  notes: Note[];
  loading: boolean;
  count: number;
  getAll: () => Promise<void>;
  getById: (id: string) => Note | undefined;
  getByEleveId: (eleveId: string) => Note[];
  getByMatiereId: (matiereId: string) => Note[];
  getByTrimestre: (trimestre: Trimestre) => Note[];
  getBulletinFromApi: (eleveId: string, trimestre: Trimestre) => Promise<BulletinMatiere[]>;
  getMoyenneGenerale: (bulletinMatieres: BulletinMatiere[]) => number;
  create: (data: Omit<Note, 'id'>) => Promise<boolean>;
  update: (id: string, data: Partial<Note>) => Promise<boolean>;
  delete: (id: string) => Promise<void>;
}

const NoteContext = createContext<NoteContextType | undefined>(undefined);

export function NoteProvider({ children }: { children: ReactNode }) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);

  const getAll = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/notes`);
      if (response.ok) {
        const data = await response.json();
        if (data && data.length > 0) {
          setNotes(data);
        } else {
          setNotes(mockNotes);
        }
      } else {
        setNotes(mockNotes);
      }
    } catch (error) {
      console.log('API unavailable, using mock data for notes');
      setNotes(mockNotes);
    } finally {
      setLoading(false);
    }
  }, []);

  const getById = useCallback((id: string) => {
    return notes.find(n => n.id === id);
  }, [notes]);

  const getByEleveId = useCallback((eleveId: string) => {
    return notes.filter(n => n.eleve_id === eleveId);
  }, [notes]);

  const getByMatiereId = useCallback((matiereId: string) => {
    return notes.filter(n => n.matiere_id === matiereId);
  }, [notes]);

  const getByTrimestre = useCallback((trimestre: Trimestre) => {
    return notes.filter(n => n.trimestre === trimestre);
  }, [notes]);

  const getBulletinFromApi = useCallback(async (eleveId: string, trimestre: Trimestre): Promise<BulletinMatiere[]> => {
    try {
      const response = await fetch(`${API_BASE_URL}/notes/bulletin/${eleveId}?trimestre=${trimestre}`);
      if (response.ok) {
        const data = await response.json();
        if (data && data.length > 0) {
          return data;
        }
        return generateMockBulletin(eleveId, trimestre);
      }
      return generateMockBulletin(eleveId, trimestre);
    } catch (error) {
      console.log('API unavailable, using mock bulletin');
      return generateMockBulletin(eleveId, trimestre);
    }
  }, []);

  const getMoyenneGenerale = useCallback((bulletinMatieres: BulletinMatiere[]): number => {
    if (bulletinMatieres.length === 0) return 0;
    
    let totalCoef = 0;
    let somme = 0;
    
    for (const matiere of bulletinMatieres) {
      if (matiere.notes.length > 0) {
        somme += matiere.moyenne * matiere.coefficient;
        totalCoef += matiere.coefficient;
      }
    }
    
    if (totalCoef === 0) return 0;
    return Math.round((somme / totalCoef) * 10) / 10;
  }, []);

  const create = useCallback(async (data: Omit<Note, 'id'>): Promise<boolean> => {
    try {
      const response = await fetch(`${API_BASE_URL}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (response.ok) {
        const newNote = await response.json();
        setNotes(prev => [...prev, newNote]);
        return true;
      }
      return false;
    } catch (error) {
      const newNote: Note = {
        ...data,
        id: `note-${Date.now()}`,
      };
      setNotes(prev => [...prev, newNote]);
      return true;
    }
  }, []);

  const update = useCallback(async (id: string, data: Partial<Note>): Promise<boolean> => {
    try {
      const response = await fetch(`${API_BASE_URL}/notes/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (response.ok) {
        const updatedNote = await response.json();
        setNotes(prev => prev.map(n => n.id === id ? updatedNote : n));
        return true;
      }
      return false;
    } catch (error) {
      setNotes(prev => prev.map(n => n.id === id ? { ...n, ...data } as Note : n));
      return true;
    }
  }, []);

  const deleteNote = useCallback(async (id: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/notes/${id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        setNotes(prev => prev.filter(n => n.id !== id));
      }
    } catch (error) {
      setNotes(prev => prev.filter(n => n.id !== id));
    }
  }, []);

  useEffect(() => {
    getAll();

    const unsubCreated = onEvent<Note>('note:created', (data) => {
      setNotes(prev => {
        if (prev.find(n => n.id === data.id)) return prev;
        return [...prev, data];
      });
    });

    const unsubUpdated = onEvent<Note>('note:updated', (data) => {
      setNotes(prev => prev.map(n => n.id === data.id ? data : n));
    });

    const unsubDeleted = onEvent<{ id: string }>('note:deleted', (data) => {
      setNotes(prev => prev.filter(n => n.id !== data.id));
    });

    return () => {
      unsubCreated();
      unsubUpdated();
      unsubDeleted();
    };
  }, [getAll]);

  const count = useMemo(() => notes.length, [notes]);

  const value: NoteContextType = {
    notes,
    loading,
    count,
    getAll,
    getById,
    getByEleveId,
    getByMatiereId,
    getByTrimestre,
    getBulletinFromApi,
    getMoyenneGenerale,
    create,
    update,
    delete: deleteNote,
  };

  return (
    <NoteContext.Provider value={value}>
      {children}
    </NoteContext.Provider>
  );
}

export function useNotes() {
  const context = useContext(NoteContext);
  if (context === undefined) {
    throw new Error('useNotes must be used within a NoteProvider');
  }
  return context;
}
