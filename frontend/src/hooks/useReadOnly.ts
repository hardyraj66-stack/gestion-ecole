import { useViewing } from '../contexts/ViewingContext';
import { useAnneeScolaireStatus } from './useAnneeScolaireStatus';

/** true when viewing an archived year OR when the active year is terminated */
export function useReadOnly() {
  const { isViewingArchive } = useViewing();
  const { isTerminee } = useAnneeScolaireStatus();
  return isViewingArchive || isTerminee;
}
