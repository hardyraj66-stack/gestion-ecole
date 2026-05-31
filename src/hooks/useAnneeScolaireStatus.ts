import { useMemo } from 'react';
import { useAnnees } from '../contexts/AnneeContext';

export function useAnneeScolaireStatus() {
  const { active, preparation, annees } = useAnnees();
  const today = new Date().toISOString().slice(0, 10);

  return useMemo(() => {
    // Dashboard : afficher l'alerte "peut commencer"
    const peutCommencer =
      !!preparation && !active && !!preparation.debut_planifie &&
      today >= preparation.debut_planifie;

    // Bouton Terminer : vert si date atteinte ou dépassée
    const terminaisonPlanifieeAtteinte =
      !!active?.fin_planifie && today >= active.fin_planifie;

    // Bouton Terminer : rouge si avant la date planifiée
    const terminaisonAnticipee =
      !!active?.fin_planifie && today < active.fin_planifie;

    // Bouton Terminer : orange si date non renseignée
    const terminaisonSansDate = !!active && !active.fin_planifie;

    // Mode consultation post-clôture : aucune année active + au moins une terminée
    const isTerminee = !active && annees.some(a => a.statut === 'terminee');

    // Jours restants avant date de fin planifiée
    const joursAvantFin = active?.fin_planifie
      ? Math.round(
          (new Date(active.fin_planifie).getTime() - new Date(today).getTime()) /
          (1000 * 60 * 60 * 24)
        )
      : null;

    return {
      peutCommencer,
      terminaisonPlanifieeAtteinte,
      terminaisonAnticipee,
      terminaisonSansDate,
      isTerminee,
      joursAvantFin,
    };
  }, [active, preparation, annees, today]);
}
