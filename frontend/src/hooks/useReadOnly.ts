import { useViewing } from '../contexts/ViewingContext';
import { useAnneeScolaireStatus } from './useAnneeScolaireStatus';
import { useAuth } from '../contexts/AuthContext';

/**
 * true en lecture seule : consultation d'une année archivée, année terminée,
 * OU utilisateur professeur (qui ne fait que consulter, hors saisie de notes).
 */
export function useReadOnly() {
  const { isViewingArchive } = useViewing();
  const { isTerminee } = useAnneeScolaireStatus();
  const { hasRole } = useAuth();
  return isViewingArchive || isTerminee || hasRole('professeur');
}
