import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useViewing } from '../../contexts/ViewingContext';
import { useReadOnly } from '../../hooks/useReadOnly';
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
import { exportQs } from '../../utils/helpers';
import { Icon, Icons } from '../../components/shared/Icon';

export function EvaluationsList() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isViewingArchive, viewingId } = useViewing();
  const readOnly = useReadOnly();
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
    const ok = await confirm(t('evaluations.actions.confirmerSuppr'));
    if (ok) await deleteEvaluation(id);
  };

  if (loading || !data) return <PageLoader />;
  if (error) return <Alert variant="error">{t('evaluations.erreur')}</Alert>;

  const { items, total } = data;

  const classesOptions: SelectOption[] = [
    { value: '', label: t('evaluations.toutesClasses') },
    ...classes.map((c: any) => ({ value: c.id, label: c.nom })),
  ];
  const matieresOptions: SelectOption[] = [
    { value: '', label: t('evaluations.toutesMatieres') },
    ...matieres.map((m: any) => ({ value: m.id, label: m.nom })),
  ];
  const trimestreOptions: SelectOption[] = [
    { value: '', label: t('evaluations.tousTrimestres') },
    { value: '1', label: t('evaluations.form.trimestreOpt', { t: 1 }) },
    { value: '2', label: t('evaluations.form.trimestreOpt', { t: 2 }) },
    { value: '3', label: t('evaluations.form.trimestreOpt', { t: 3 }) },
  ];
  const statutOptions: SelectOption[] = [
    { value: '', label: t('evaluations.tousStatuts') },
    { value: 'brouillon', label: t('evaluations.statuts.brouillon') },
    { value: 'publie', label: t('evaluations.statuts.publie') },
  ];

  return (
    <div>
      <PageHeader title={t('evaluations.titre')} subtitle={t('evaluations.nbEvaluations', { count: total })}>
        <ExportMenu
          csvUrl={`/export/evaluations/csv${exportQs({ classeId, matiereId, trimestre, anneeId: viewingId })}`}
          xlsxUrl={`/export/evaluations/xlsx${exportQs({ classeId, matiereId, trimestre, anneeId: viewingId })}`}
        />
        {!readOnly && (
          <Button variant="primary" onClick={() => navigate('/evaluations/nouvelle')}>
            {t('evaluations.nouvelleEval')}
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
          message={t('evaluations.aucuneEvaluation')}
          action={!readOnly ? (
            <Button variant="primary" onClick={() => navigate('/evaluations/nouvelle')}>{t('evaluations.creer')}</Button>
          ) : undefined}
        />
      ) : (
        <>
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>{t('evaluations.colonnes.type')}</th>
                  <th>{t('evaluations.colonnes.matiere')}</th>
                  <th>{t('evaluations.colonnes.classe')}</th>
                  <th>{t('evaluations.colonnes.trimestre')}</th>
                  <th>{t('evaluations.colonnes.date')}</th>
                  <th>{t('evaluations.colonnes.progression')}</th>
                  <th>{t('evaluations.colonnes.moyenne')}</th>
                  <th>{t('evaluations.colonnes.statut')}</th>
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
                      <Badge
                        variant={ev.type === 'ds' ? 'primary' : 'info'}
                        label={ev.type === 'ds' ? t('evaluations.types.ds') : t('evaluations.types.evaluation')}
                      />
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
                      <Badge
                        variant={ev.statut === 'brouillon' ? 'warning' : 'success'}
                        label={ev.statut === 'brouillon' ? t('evaluations.statuts.brouillon') : t('evaluations.statuts.publie')}
                      />
                    </td>
                    {!readOnly && (
                      <td onClick={e => e.stopPropagation()}>
                        {ev.statut === 'brouillon' && (
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => handleDelete(ev.id)}
                          >
                            {t('evaluations.actions.supprimer')}
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
