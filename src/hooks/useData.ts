import { useMemo } from 'react';
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
  /** true si on regarde une archive (lecture seule) */
  readOnly: boolean;
}

/**
 * Retourne les données de l'année consultée (snapshot) ou les données live.
 * Les pages utilisent ce hook pour être transparentes au mode archive.
 */
export function useData(): DataResult {
  const { isViewingArchive, snapshot, loadingSnapshot } = useViewing();

  const { classes: liveClasses, loading: l1 } = useClasses();
  const { eleves: liveEleves, loading: l2 } = useEleves();
  const { matieres: liveMatieres, loading: l3 } = useMatieres();
  const { notes: liveNotes, loading: l4 } = useNotes();
  const { creneaux: liveCreneaux, loading: l5 } = usePlanning();

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
