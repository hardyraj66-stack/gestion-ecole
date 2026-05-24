import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { EleveStatut } from '../../types';
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
import { FicheStatut } from './FicheStatut';

export function EleveFiche() {
  const { id } = useParams<{ id: string }>();
  const { data, loading, error, readOnly } = useEleveFicheData(id || '');
  const [statut, setStatut] = useState<EleveStatut | null>(null);
  const [nbAvertissements, setNbAvertissements] = useState(0);

  if (loading || !data) return <PageLoader />;
  if (error) return <Alert variant="error">Impossible de charger la fiche de cet élève.</Alert>;

  const { eleve, classe, salleActuelle, creneaux, anneeActive } = data;
  const statutCourant: EleveStatut = statut ?? (eleve.statut as EleveStatut) ?? 'actif';

  const statutSuffix = statutCourant === 'exclu' ? ' · Exclu' : statutCourant === 'parti' ? ' · Parti' : '';

  return (
    <div>
      <PageHeader
        title={`${eleve.prenom} ${eleve.nom}${statutSuffix}`}
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
          <FicheIdentite eleve={{ ...eleve, statut: statutCourant }} classe={classe} salleActuelle={salleActuelle} creneaux={creneaux} readOnly={readOnly} eleveId={id!} />
          <FicheFamille eleve={eleve} readOnly={readOnly} eleveId={id!} />
          <FicheStatut
            eleveId={id!}
            nomComplet={`${eleve.prenom} ${eleve.nom}`}
            statut={statutCourant}
            anneeActive={anneeActive}
            nbAvertissements={nbAvertissements}
            readOnly={readOnly}
            onStatutChange={setStatut}
          />
        </div>

        {/* Colonne droite */}
        <div className="fiche-col-right">
          <FicheShortcuts eleveId={id!} classeId={eleve.classe_id} />
          <FicheAvertissements
            eleveId={id!}
            anneeActive={anneeActive}
            readOnly={readOnly}
            onCountChange={setNbAvertissements}
          />
          <FicheAssiduité eleveId={id!} readOnly={readOnly} />
        </div>
      </div>
    </div>
  );
}
