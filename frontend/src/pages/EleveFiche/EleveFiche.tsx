import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { EleveStatut, getClasseActive } from '../../types';
import { useEleveFicheData } from '../../hooks/usePageData';
import { useViewing } from '../../contexts/ViewingContext';
import { useAnneeScolaireStatus } from '../../hooks/useAnneeScolaireStatus';
import { useAuth } from '../../contexts/AuthContext';
import { PageHeader } from '../../components/ui/PageHeader';
import { PageLoader } from '../../components/ui/PageLoader';
import { Button } from '../../components/shared/Button';
import { Alert } from '../../components/shared/Alert';
import { API_BASE_URL } from '../../config/api';
import { FicheIdentite } from './FicheIdentite';
import { FicheFamille } from './FicheFamille';
import { FicheShortcuts } from './FicheShortcuts';
import { FicheAvertissements } from './FicheAvertissements';
import { FicheAssiduité } from './FicheAssiduité';
import { FicheStatut } from './FicheStatut';
import { FicheParcours } from './FicheParcours';

export function EleveFiche() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const { viewingId } = useViewing();
  const { isTerminee } = useAnneeScolaireStatus();
  const { hasRole } = useAuth();
  const { data, loading, error, readOnly: readOnlyArchive } = useEleveFicheData(id || '');
  const readOnly = readOnlyArchive || isTerminee || hasRole('professeur');
  const [statut, setStatut] = useState<EleveStatut | null>(null);
  const [nbAvertissements, setNbAvertissements] = useState(0);
  // anneeId passé aux sous-composants pour isoler les données de suivi par année
  const anneeId = viewingId ?? undefined;

  if (loading || !data) return <PageLoader />;
  if (error) return <Alert variant="error">{t('fiche.erreurChargement')}</Alert>;

  const { eleve, classe, salleActuelle, creneaux, anneeActive, anneeActiveId } = data;
  const statutCourant: EleveStatut = statut ?? (eleve.statut as EleveStatut) ?? 'actif';

  const statutSuffix = statutCourant === 'exclu' ? t('eleves.statuts.exclu') : statutCourant === 'parti' ? t('eleves.statuts.parti') : '';

  return (
    <div>
      <PageHeader
        title={`${eleve.prenom} ${eleve.nom}${statutSuffix}`}
        subtitle={classe ? `${classe.nom} — ${classe.niveau}` : t('fiche.classeInconnue')}
      >
        <Button as="link" to="/eleves" variant="secondary">{t('fiche.retour')}</Button>
        {!readOnly && (
          <Button as="link" to={`/eleves/${id}/bulletin`} variant="outline">{t('fiche.bulletin')}</Button>
        )}
        <Button
          variant="outline"
          onClick={() => window.open(`${API_BASE_URL}/export/carte/${id}${viewingId ? `?anneeId=${viewingId}` : ''}`, '_blank')}
          title={t('fiche.carteScolaireTitle')}
        >
          {t('fiche.carteScolaire')}
        </Button>
      </PageHeader>

      {isTerminee && !readOnlyArchive && (
        <Alert variant="info" icon={false}>
          {t('layout.aucuneAnneeActive')} {t('layout.aucuneAnneeActiveMsg')}
        </Alert>
      )}

      <div className="fiche-layout">
        <div className="fiche-col-left">
          <FicheIdentite eleve={{ ...eleve, statut: statutCourant }} classe={classe} salleActuelle={salleActuelle} creneaux={creneaux} readOnly={readOnly} eleveId={id!} />
          <FicheFamille eleve={eleve} readOnly={readOnly} eleveId={id!} />
          <FicheStatut
            eleveId={id!}
            nomComplet={`${eleve.prenom} ${eleve.nom}`}
            statut={statutCourant}
            anneeActiveId={anneeActiveId ?? anneeActive ?? null}
            nbAvertissements={nbAvertissements}
            readOnly={readOnly}
            onStatutChange={setStatut}
          />
          <FicheParcours inscriptions={eleve.inscriptions ?? []} readOnly={readOnly} />
        </div>

        <div className="fiche-col-right">
          <FicheShortcuts eleveId={id!} classeId={getClasseActive(eleve)?.classeId ?? eleve.classe_id ?? ''} />
          <FicheAvertissements
            eleveId={id!}
            anneeActiveId={anneeActiveId ?? anneeActive ?? null}
            anneeId={anneeId}
            readOnly={readOnly}
            onCountChange={setNbAvertissements}
          />
          <FicheAssiduité eleveId={id!} anneeId={anneeId} readOnly={readOnly} />
        </div>
      </div>
    </div>
  );
}
