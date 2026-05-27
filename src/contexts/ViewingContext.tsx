import { createContext, useContext, useState, useCallback, ReactNode, useMemo } from 'react';
import { AnneeScolaire, Classe, Eleve, Matiere, Note, Creneau } from '../types';
import { API_BASE_URL } from '../config/api';

interface Snapshot {
  annee: AnneeScolaire;
  classes: Classe[];
  eleves: Eleve[];
  matieres: Matiere[];
  notes: Note[];
  creneaux: Creneau[];
}

interface ViewingContextType {
  /** L'année qu'on consulte (null = année courante) */
  viewing: AnneeScolaire | null;
  /** Label de l'année consultée (ex: "2022-2023"), null si mode live */
  viewingLabel: string | null;
  /** ID MongoDB de l'année consultée, null si mode live */
  viewingId: string | null;
  /** Les données snapshot de l'année consultée */
  snapshot: Snapshot | null;
  /** true pendant le chargement du snapshot */
  loadingSnapshot: boolean;
  /** Consulter une année archivée */
  viewAnnee: (annee: AnneeScolaire) => Promise<void>;
  /** Revenir à l'année courante */
  exitView: () => void;
  /** true si on consulte une année archivée */
  isViewingArchive: boolean;
}

const ViewingContext = createContext<ViewingContextType | undefined>(undefined);

export function ViewingProvider({ children }: { children: ReactNode }) {
  const [viewing, setViewing] = useState<AnneeScolaire | null>(null);
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [loadingSnapshot, setLoadingSnapshot] = useState(false);

  const viewAnnee = useCallback(async (annee: AnneeScolaire) => {
    setLoadingSnapshot(true);
    setViewing(annee);
    try {
      const res = await fetch(`${API_BASE_URL}/annees/${annee.id}/snapshot`);
      if (res.ok) {
        const data = await res.json();
        setSnapshot(data);
      } else {
        // Fallback : on met un snapshot vide mais on garde l'année
        setSnapshot({ annee, classes: [], eleves: [], matieres: [], notes: [], creneaux: [] });
      }
    } catch {
      setSnapshot({ annee, classes: [], eleves: [], matieres: [], notes: [], creneaux: [] });
    } finally {
      setLoadingSnapshot(false);
    }
  }, []);

  const exitView = useCallback(() => {
    setViewing(null);
    setSnapshot(null);
  }, []);

  const isViewingArchive = useMemo(() => viewing !== null, [viewing]);
  const viewingLabel = useMemo(() => viewing?.label ?? null, [viewing]);
  const viewingId = useMemo(() => viewing?.id ?? null, [viewing]);

  return (
    <ViewingContext.Provider value={{ viewing, viewingLabel, viewingId, snapshot, loadingSnapshot, viewAnnee, exitView, isViewingArchive }}>
      {children}
    </ViewingContext.Provider>
  );
}

export function useViewing() {
  const ctx = useContext(ViewingContext);
  if (!ctx) throw new Error('useViewing must be used within ViewingProvider');
  return ctx;
}
