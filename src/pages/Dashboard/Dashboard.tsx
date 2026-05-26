import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAnnees } from '../../contexts/AnneeContext';
import { useViewing } from '../../contexts/ViewingContext';
import { useDashboardData } from '../../hooks/usePageData';
import { PageHeader } from '../../components/ui/PageHeader';
import { StatCard } from '../../components/ui/StatCard';
import { PageLoader } from '../../components/ui/PageLoader';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/shared/Button';
import { Card } from '../../components/shared/Card';
import { Alert } from '../../components/shared/Alert';
import { ClassesTable } from './ClassesTable';
import { RecentEleves } from './RecentEleves';
import { QuickActions } from './QuickActions';
import { ConvocationsWidget } from './ConvocationsWidget';

export function Dashboard() {
  const { t } = useTranslation();
  const { active, preparation } = useAnnees();
  const { viewing, isViewingArchive: readOnly } = useViewing();
  const [classesPage, setClassesPage] = useState(1);

  const { data, loading, error } = useDashboardData(classesPage);

  const subtitle = viewing ? t('dashboard.archiveAnnee', { label: viewing.label }) : t('dashboard.sousTitre');

  if (loading || !data) return <PageLoader />;
  if (error) return <Alert variant="error">{t('dashboard.erreurChargement')}</Alert>;

  const { stats, classesWithCount, classesPagination, recentEleves, convocationsRecentes } = data;

  return (
    <div>
      <PageHeader title={t('nav.dashboard')} subtitle={subtitle}>
        {!readOnly && active && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Badge label={active.label} variant="primary" />
            <Badge label={t('sidebar.statut.active')} variant="success" />
          </div>
        )}
        {!readOnly && !active && preparation && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Badge label={preparation.label} variant="warning" />
            <Button as="link" to="/annee-scolaire" variant="outline" size="sm">{t('dashboard.configurer')}</Button>
          </div>
        )}
      </PageHeader>

      {!readOnly && !active && preparation && (
        <Card style={{ marginBottom: '1.5rem', borderLeft: '4px solid var(--warning)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <p style={{ fontWeight: 600, marginBottom: '0.25rem' }}>⚠️ {t('dashboard.aucuneAnneeActive')}</p>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{t('dashboard.demarrerAnnee', { label: preparation.label })}</p>
          </div>
          <Button as="link" to="/annee-scolaire" variant="primary">{t('dashboard.gererCycle')}</Button>
        </Card>
      )}

      <div className="stats-grid">
        <StatCard title={t('nav.classes')} value={stats.classes} subtitle={t('dashboard.stats.toutesNiveaux')} color="blue" icon="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
        <StatCard title={t('nav.eleves')} value={stats.eleves} subtitle={readOnly ? t('sidebar.statut.archive') : t('dashboard.stats.actifs')} color="purple" icon="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <StatCard title={t('nav.matieres')} value={stats.matieres} subtitle={t('dashboard.stats.auProgramme')} color="green" icon="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
        <StatCard title={t('nav.notes')} value={stats.notes} subtitle={readOnly ? t('sidebar.statut.archive') : t('dashboard.stats.total')} color="orange" icon="M12 20h9" />
      </div>

      <div className="dashboard-grid">
        <div>
          <ClassesTable classes={classesWithCount} pagination={classesPagination} onPageChange={setClassesPage} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {!readOnly && convocationsRecentes?.length > 0 && (
            <ConvocationsWidget convocations={convocationsRecentes} />
          )}
          <RecentEleves eleves={recentEleves} />
          {!readOnly && <QuickActions />}
        </div>
      </div>
    </div>
  );
}
