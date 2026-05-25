import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useViewing } from '../../contexts/ViewingContext';
import { useEvaluations } from '../../contexts/EvaluationContext';
import { useEvaluationsListData } from '../../hooks/useEvaluationData';
import { readApi } from '../../services/readApi';
import { PageHeader } from '../../components/ui/PageHeader';
import { PageLoader } from '../../components/ui/PageLoader';
import { EmptyState } from '../../components/ui/EmptyState';
import { Button } from '../../components/shared/Button';
import { Badge } from '../../components/ui/Badge';
import { Alert } from '../../components/shared/Alert';
import { Select, SelectOption } from '../../components/shared/Select';
import { Pagination } from '../../components/shared/Pagination';
import { useConfirm } from '../../components/shared/ConfirmDialog';
import { ExportMenu } from '../../components/shared/ExportMenu';
import { Icon, Icons } from '../../components/shared/Icon';

const TYPE_LABELS: Record<string, string> = { ds: 'DS', evaluation: 'Évaluation' };
const STATUT_VARIANT: Record<string, 'warning' | 'success'> = { brouillon: 'warning', publie: 'success' };
const STATUT_LABELS: Record<string, string> = { brouillon: 'Brouillon', publie: 'Publié' };

export function EvaluationsList() {
  const navigate = useNavigate();
  const { isViewingArchive: readOnly } = useViewing();
  const { deleteEvaluation } = useEvaluations();
  const confirm = useConfirm();

  const [page, setPage] = useState(1);
  const [classeId, setClasseId] = useState('');
  const [matiereId, setMatiereId] = useState('');
  const [trimestre, setTrimestre] = useState('');
  const [statut, setStatut] = useState('');
  const [classes, setClasses] = useState<any[]>([]);
  const [matieres, setMatieres] = useState<any[]>([]);

  const { data, loading, error } = useEvaluationsListData(
    classeId || undefined, matiereId || undefined,
    trimestre ? parseInt(trimestre) : undefined,
    statut || undefined, page,
  );

  useEffect(() => {
    Promise.all([
      readApi.classesList(1, 100),
      readApi.matieresList(1, 100),
    ]).then(([c, m]) => {
      if (c) setClasses((c as any).items || []);
      if (m) setMatieres((m as any).items || []);
    });
  }, []);

  const handleFilter = (setter: (v: string) => void) => (e: React.ChangeEvent<HTMLSelectElement>) => {
    setter(e.target.value);
    setPage(1);
  };

  const handleDelete = async (id: string) => {
    const ok = await confirm('Supprimer cette évaluation ? Cette action est irréversible.');
    if (ok) await deleteEvaluation(id);
  };

  if (loading || !data) return <PageLoader />;
  if (error) return <Alert variant="error">Problème de chargement des évaluations.</Alert>;

  const { items, total, totalPages } = data;

  const classesOptions: SelectOption[] = [
    { value: '', label: 'Toutes les classes' },
    ...classes.map((c: any) => ({ value: c.id, label: c.nom })),
  ];
  const matieresOptions: SelectOption[] = [
    { value: '', label: 'Toutes les matières' },
    ...matieres.map((m: any) => ({ value: m.id, label: m.nom })),
  ];
  const trimestreOptions: SelectOption[] = [
    { value: '', label: 'Tous les trimestres' },
    { value: '1', label: 'Trimestre 1' },
    { value: '2', label: 'Trimestre 2' },
    { value: '3', label: 'Trimestre 3' },
  ];
  const statutOptions: SelectOption[] = [
    { value: '', label: 'Tous les statuts' },
    { value: 'brouillon', label: 'Brouillon' },
    { value: 'publie', label: 'Publié' },
  ];

  return (
    <div>
      <PageHeader title="Évaluations" subtitle={`${total} évaluation(s)`}>
        <ExportMenu
          csvUrl={`/export/evaluations/csv?${[classeId && `classeId=${classeId}`, matiereId && `matiereId=${matiereId}`, trimestre && `trimestre=${trimestre}`].filter(Boolean).join('&')}`}
          xlsxUrl={`/export/evaluations/xlsx?${[classeId && `classeId=${classeId}`, matiereId && `matiereId=${matiereId}`, trimestre && `trimestre=${trimestre}`].filter(Boolean).join('&')}`}
        />
        {!readOnly && (
          <Button variant="primary" onClick={() => navigate('/evaluations/nouvelle')}>
            + Nouvelle évaluation
          </Button>
        )}
      </PageHeader>

      <div className="filter-bar" style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
        <div style={{ minWidth: 160 }}>
          <Select options={classesOptions} value={classeId} onChange={handleFilter(setClasseId)} label="" fullWidth={false} />
        </div>
        <div style={{ minWidth: 160 }}>
          <Select options={matieresOptions} value={matiereId} onChange={handleFilter(setMatiereId)} label="" fullWidth={false} />
        </div>
        <div style={{ minWidth: 140 }}>
          <Select options={trimestreOptions} value={trimestre} onChange={handleFilter(setTrimestre)} label="" fullWidth={false} />
        </div>
        <div style={{ minWidth: 130 }}>
          <Select options={statutOptions} value={statut} onChange={handleFilter(setStatut)} label="" fullWidth={false} />
        </div>
      </div>

      {items.length === 0 ? (
        <EmptyState
          icon={<Icon path={Icons.book} size={28} />}
          message="Aucune évaluation trouvée"
          action={!readOnly ? (
            <Button variant="primary" onClick={() => navigate('/evaluations/nouvelle')}>Créer</Button>
          ) : undefined}
        />
      ) : (
        <>
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Matière</th>
                  <th>Classe</th>
                  <th>Trimestre</th>
                  <th>Date</th>
                  <th>Progression</th>
                  <th>Moyenne</th>
                  <th>Statut</th>
                  {!readOnly && <th></th>}
                </tr>
              </thead>
              <tbody>
                {items.map((ev: any) => (
                  <tr
                    key={ev.id}
                    className="table-row-clickable"
                    onClick={() => navigate(`/evaluations/${ev.id}`)}
                    style={{ cursor: 'pointer' }}
                  >
                    <td>
                      <Badge variant={ev.type === 'ds' ? 'primary' : 'info'}>
                        {TYPE_LABELS[ev.type]}
                      </Badge>
                    </td>
                    <td>
                      <strong>{ev.matiere_nom}</strong>
                      <span style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem', marginLeft: '0.4rem' }}>
                        {ev.matiere_code}
                      </span>
                    </td>
                    <td>{ev.classe_nom}</td>
                    <td>T{ev.trimestre}</td>
                    <td>{ev.date}</td>
                    <td>
                      {ev.nb_notes_saisies}/{ev.nb_eleves}
                      {ev.nb_eleves > 0 && (
                        <div className="progress-bar-mini" style={{ width: 60, marginTop: 2 }}>
                          <div
                            style={{
                              height: 4, borderRadius: 2, background: 'var(--color-primary)',
                              width: `${Math.round((ev.nb_notes_saisies / ev.nb_eleves) * 100)}%`,
                            }}
                          />
                        </div>
                      )}
                    </td>
                    <td>{ev.moyenne_classe !== null ? `${ev.moyenne_classe}/20` : '—'}</td>
                    <td>
                      <Badge variant={STATUT_VARIANT[ev.statut] || 'default'}>
                        {STATUT_LABELS[ev.statut] || ev.statut}
                      </Badge>
                    </td>
                    {!readOnly && (
                      <td onClick={e => e.stopPropagation()}>
                        {ev.statut === 'brouillon' && (
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => handleDelete(ev.id)}
                          >
                            Supprimer
                          </Button>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination currentPage={page} totalItems={total} pageSize={10} onPageChange={setPage} />
        </>
      )}

    </div>
  );
}
