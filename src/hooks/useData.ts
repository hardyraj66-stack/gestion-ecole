import { useMemo, useEffect } from 'react';
import { useViewing } from '../contexts/ViewingContext';
import { useClasses } from '../contexts/ClasseContext';
import { useEleves } from '../contexts/EleveContext';
import { useMatieres } from '../contexts/MatiereContext';
import { useNotes } from '../contexts/NoteContext';
import { usePlanning } from '../contexts/PlanningContext';
import { Classe, Eleve, Matiere, Note, Creneau } from '../types';

interface DataResult {
  classes: Classe[];
  eleves: Eleve[];
  matieres: Matiere[];
  notes: Note[];
  creneaux: Creneau[];
  loading: boolean;
  readOnly: boolean;
}

/**
 * Hook central : déclenche les fetches à la demande et retourne
 * soit les données live, soit le snapshot en mode archive.
 * Chaque page qui appelle useData() déclenche le chargement.
 */
export function useData(): DataResult {
  const { isViewingArchive, snapshot, loadingSnapshot } = useViewing();

  const { classes: liveClasses, loading: l1, getAll: fetchClasses } = useClasses();
  const { eleves: liveEleves, loading: l2, getAll: fetchEleves } = useEleves();
  const { matieres: liveMatieres, loading: l3, getAll: fetchMatieres } = useMatieres();
  const { notes: liveNotes, loading: l4, getAll: fetchNotes } = useNotes();
  const { creneaux: liveCreneaux, loading: l5, getAll: fetchPlanning } = usePlanning();

  // Déclencher les fetches à chaque montage de composant qui utilise useData()
  useEffect(() => {
    if (!isViewingArchive) {
      fetchClasses();
      fetchEleves();
      fetchMatieres();
      fetchNotes();
      fetchPlanning();
    }
  }, [isViewingArchive, fetchClasses, fetchEleves, fetchMatieres, fetchNotes, fetchPlanning]);

  return useMemo(() => {
    if (isViewingArchive && snapshot) {
      return {
        classes: snapshot.classes,
        eleves: snapshot.eleves,
        matieres: snapshot.matieres,
        notes: snapshot.notes,
        creneaux: snapshot.creneaux,
        loading: loadingSnapshot,
        readOnly: true,
      };
    }

    return {
      classes: liveClasses,
      eleves: liveEleves,
      matieres: liveMatieres,
      notes: liveNotes,
      creneaux: liveCreneaux,
      loading: l1 || l2 || l3 || l4 || l5,
      readOnly: false,
    };
  }, [isViewingArchive, snapshot, loadingSnapshot, liveClasses, liveEleves, liveMatieres, liveNotes, liveCreneaux, l1, l2, l3, l4, l5]);
}
