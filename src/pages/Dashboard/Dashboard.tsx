import { useState } from 'react';
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
  const { active, preparation } = useAnnees();
  const { viewing, isViewingArchive: readOnly } = useViewing();
  const [classesPage, setClassesPage] = useState(1);

  const { data, loading, error } = useDashboardData(classesPage);

  const subtitle = viewing ? `Archive de l'année ${viewing.label}` : "Vue d'ensemble";

  if (loading || !data) return <PageLoader />;
  if (error) return <Alert variant="error">Problème de chargement du dashboard.</Alert>;

  const { stats, classesWithCount, classesPagination, recentEleves, convocationsRecentes } = data;

  return (
    <div>
      <PageHeader title="Dashboard" subtitle={subtitle}>
        {!readOnly && active && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Badge label={active.label} variant="primary" />
            <Badge label="Active" variant="success" />
          </div>
        )}
        {!readOnly && !active && preparation && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Badge label={preparation.label} variant="warning" />
            <Button as="link" to="/annee-scolaire" variant="outline" size="sm">Configurer</Button>
          </div>
        )}
      </PageHeader>

      {!readOnly && !active && preparation && (
        <Card style={{ marginBottom: '1.5rem', borderLeft: '4px solid var(--warning)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <p style={{ fontWeight: 600, marginBottom: '0.25rem' }}>⚠️ Aucune année active</p>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Démarrez « {preparation.label} ».</p>
          </div>
          <Button as="link" to="/annee-scolaire" variant="primary">Gérer le cycle</Button>
        </Card>
      )}

      <div className="stats-grid">
        <StatCard title="Classes" value={stats.classes} subtitle="Toutes niveaux" color="blue" icon="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
        <StatCard title="Élèves" value={stats.eleves} subtitle={readOnly ? 'Archive' : 'Actifs'} color="purple" icon="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <StatCard title="Matières" value={stats.matieres} subtitle="Au programme" color="green" icon="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
        <StatCard title="Notes" value={stats.notes} subtitle={readOnly ? 'Archive' : 'Total'} color="orange" icon="M12 20h9" />
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
