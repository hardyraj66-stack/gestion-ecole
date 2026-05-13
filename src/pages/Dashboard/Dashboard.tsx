import { useMemo } from 'react';
import { useAnnees } from '../../contexts/AnneeContext';
import { useViewing } from '../../contexts/ViewingContext';
import { useData } from '../../hooks/useData';
import { PageHeader } from '../../components/ui/PageHeader';
import { StatCard } from '../../components/ui/StatCard';
import { PageLoader } from '../../components/ui/PageLoader';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/shared/Button';
import { Card } from '../../components/shared/Card';
import { ClassesTable } from './ClassesTable';
import { RecentEleves } from './RecentEleves';
import { QuickActions } from './QuickActions';

export function Dashboard() {
  const { classes, eleves, matieres, notes, loading, readOnly } = useData();
  const { active, preparation } = useAnnees();
  const { viewing } = useViewing();

  const subtitle = viewing
    ? `Archive de l'année ${viewing.label}`
    : "Vue d'ensemble de votre établissement";

  const classesWithCount = useMemo(() => {
    return classes.map(classe => {
      const nb_eleves = eleves.filter(e => e.classe_id === classe.id).length;
      const taux = Math.min(Math.round((nb_eleves / classe.capacite) * 100), 100);
      return { ...classe, nb_eleves, taux };
    });
  }, [classes, eleves]);

  if (loading) return <PageLoader />;

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
            <p style={{ fontWeight: 600, marginBottom: '0.25rem' }}>⚠️ Aucune année scolaire active</p>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              L'année « {preparation.label} » est en préparation. Démarrez-la depuis le cycle scolaire.
            </p>
          </div>
          <Button as="link" to="/annee-scolaire" variant="primary">Gérer le cycle scolaire</Button>
        </Card>
      )}

      <div className="stats-grid">
        <StatCard title="Classes" value={classes.length} subtitle="Toutes niveaux" color="blue" icon="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
        <StatCard title="Élèves inscrits" value={eleves.length} subtitle={readOnly ? 'Archive' : 'Actifs cette année'} color="purple" icon="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <StatCard title="Matières" value={matieres.length} subtitle="Au programme" color="green" icon="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
        <StatCard title="Notes saisies" value={notes.length} subtitle={readOnly ? 'Archive' : 'Trimestre 1'} color="orange" icon="M12 20h9" />
      </div>

      <div className="dashboard-grid">
        <div>
          <ClassesTable classes={classesWithCount} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <RecentEleves eleves={eleves} classes={classes} />
          {!readOnly && <QuickActions />}
        </div>
      </div>
    </div>
  );
}
