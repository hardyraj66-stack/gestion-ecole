import { useState } from 'react';
import { useTranslation } from 'react-i18next';
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
import { API_BASE_URL } from '../../config/api';

export function Bulletin() {
  const { t } = useTranslation();
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
      <PageHeader
        title={t('bulletin.titre', { prenom: eleve.prenom, nom: eleve.nom })}
        subtitle={t('bulletin.soustitre', { trimestre, annee: classe?.annee_scolaire || '' })}
      >
        {classe && <Button as="link" to={`/classes/${classe.id}/eleves`} variant="secondary">{t('bulletin.retourClasse')}</Button>}
        <Button as="link" to="/eleves" variant="outline">{t('bulletin.tousEleves')}</Button>
        <Button
          variant="outline"
          onClick={() => window.open(`${API_BASE_URL}/export/bulletin/${id}?trimestre=${trimestre}`, '_blank')}
        >
          <Icon path="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" size={16} />
          {t('bulletin.imprimer')}
        </Button>
      </PageHeader>

      <div className="bulletin-layout">
        <StudentCard eleve={eleve} classe={classe} bulletinMatieres={bulletin} moyenneGenerale={moyenneGenerale} />
        <div>
          <TrimestreTabs selected={trimestre} onChange={setTrimestre} />
          {bulletin.length === 0 || !bulletin.some((m: any) => m.ds !== null || m.evaluation !== null) ? (
            <EmptyState
              icon={<Icon path={Icons.document} size={28} />}
              message={t('bulletin.aucuneEval', { trimestre })}
              action={!readOnly ? <Button as="link" to="/evaluations/nouvelle" variant="primary">{t('bulletin.creerEval')}</Button> : undefined}
            />
          ) : (
            <GradesTable bulletinMatieres={bulletin} moyenneGenerale={moyenneGenerale} />
          )}
        </div>
      </div>
    </div>
  );
}
