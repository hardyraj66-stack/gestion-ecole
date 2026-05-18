import { useParams } from 'react-router-dom';
import { useEleveFicheData } from '../../hooks/usePageData';
import { PageHeader } from '../../components/ui/PageHeader';
import { PageLoader } from '../../components/ui/PageLoader';
import { Button } from '../../components/shared/Button';
import { Alert } from '../../components/shared/Alert';
import { FicheIdentite } from './FicheIdentite';
import { FicheFamille } from './FicheFamille';
import { FicheShortcuts } from './FicheShortcuts';
import { FicheAvertissements } from './FicheAvertissements';
import { FicheAssiduité } from './FicheAssiduité';

export function EleveFiche() {
  const { id } = useParams<{ id: string }>();
  const { data, loading, error, readOnly } = useEleveFicheData(id || '');

  if (loading || !data) return <PageLoader />;
  if (error) return <Alert variant="error">Impossible de charger la fiche de cet élève.</Alert>;

  const { eleve, classe, salleActuelle, creneaux, anneeActive } = data;

  return (
    <div>
      <PageHeader
        title={`${eleve.prenom} ${eleve.nom}`}
        subtitle={classe ? `${classe.nom} — ${classe.niveau}` : 'Classe inconnue'}
      >
        <Button as="link" to="/eleves" variant="secondary">← Élèves</Button>
        {!readOnly && (
          <Button as="link" to={`/eleves/${id}/bulletin`} variant="outline">Bulletin</Button>
        )}
      </PageHeader>

      <div className="fiche-layout">
        {/* Colonne gauche */}
        <div className="fiche-col-left">
          <FicheIdentite eleve={eleve} classe={classe} salleActuelle={salleActuelle} creneaux={creneaux} />
          <FicheFamille eleve={eleve} readOnly={readOnly} eleveId={id!} />
        </div>

        {/* Colonne droite */}
        <div className="fiche-col-right">
          <FicheShortcuts eleveId={id!} classeId={eleve.classe_id} />
          <FicheAvertissements eleveId={id!} anneeActive={anneeActive} readOnly={readOnly} />
          <FicheAssiduité eleveId={id!} readOnly={readOnly} />
        </div>
      </div>
    </div>
  );
}
