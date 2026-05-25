import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useBulletinData } from '../../hooks/usePageData';
import { PageHeader } from '../../components/ui/PageHeader';
import { PageLoader } from '../../components/ui/PageLoader';
import { EmptyState } from '../../components/ui/EmptyState';
import { Button } from '../../components/shared/Button';
import { Icon, Icons } from '../../components/shared/Icon';
import { StudentCard } from './StudentCard';
import { TrimestreTabs } from './TrimestreTabs';
import { GradesTable } from './GradesTable';
import { BulletinMatiere, Trimestre } from '../../types';

export function Bulletin() {
  const { id } = useParams<{ id: string }>();
  const [trimestre, setTrimestre] = useState<Trimestre>(1);
  const { data, loading, readOnly } = useBulletinData(id || '', trimestre);

  if (loading || !data) return <PageLoader />;

  const { eleve, classe, bulletin } = data;

  const getMoyenneGenerale = (bm: BulletinMatiere[]): number => {
    if (!bm.length) return 0;
    let tc = 0, s = 0;
    for (const m of bm) {
      if (m.ds !== null || m.evaluation !== null) { s += m.moyenne * m.coefficient; tc += m.coefficient; }
    }
    return tc === 0 ? 0 : Math.round((s / tc) * 10) / 10;
  };

  const moyenneGenerale = bulletin.length > 0 ? getMoyenneGenerale(bulletin) : null;

  return (
    <div>
      <PageHeader title={`Bulletin de ${eleve.prenom} ${eleve.nom}`} subtitle={`Trimestre ${trimestre} — ${classe?.annee_scolaire || ''}`}>
        {classe && <Button as="link" to={`/classes/${classe.id}/eleves`} variant="secondary">← Classe</Button>}
        <Button as="link" to="/eleves" variant="outline">Tous les élèves</Button>
      </PageHeader>

      <div className="bulletin-layout">
        <StudentCard eleve={eleve} classe={classe} bulletinMatieres={bulletin} moyenneGenerale={moyenneGenerale} />
        <div>
          <TrimestreTabs selected={trimestre} onChange={setTrimestre} />
          {bulletin.length === 0 || !bulletin.some((m: any) => m.ds !== null || m.evaluation !== null) ? (
            <EmptyState icon={<Icon path={Icons.document} size={28} />} message={`Aucune évaluation pour le trimestre ${trimestre}`}
              action={!readOnly ? <Button as="link" to="/evaluations/nouvelle" variant="primary">Créer une évaluation</Button> : undefined} />
          ) : (
            <GradesTable bulletinMatieres={bulletin} moyenneGenerale={moyenneGenerale} />
          )}
        </div>
      </div>
    </div>
  );
}
