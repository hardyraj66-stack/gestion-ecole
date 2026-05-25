import { useState, useEffect } from 'react';
import { useViewing } from '../../contexts/ViewingContext';
import { useMatieresListData } from '../../hooks/usePageData';
import { readApi } from '../../services/readApi';
import { Matiere } from '../../types';
import { PageHeader } from '../../components/ui/PageHeader';
import { PageLoader } from '../../components/ui/PageLoader';
import { EmptyState } from '../../components/ui/EmptyState';
import { Button } from '../../components/shared/Button';
import { AddCard } from '../../components/shared/Card';
import { Icon, Icons } from '../../components/shared/Icon';
import { Pagination } from '../../components/shared/Pagination';
import { Alert } from '../../components/shared/Alert';
import { Select, SelectOption } from '../../components/shared/Select';
import { MatiereCard } from './MatiereCard';
import { ExportMenu } from '../../components/shared/ExportMenu';

export function MatieresList() {
  const { isViewingArchive: readOnly } = useViewing();
  const [page, setPage] = useState(1);
  const [niveau, setNiveau] = useState('');
  const [niveaux, setNiveaux] = useState<string[]>([]);
  const [localItems, setLocalItems] = useState<Matiere[] | null>(null);

  const { data, loading, error } = useMatieresListData(page, niveau);

  useEffect(() => {
    readApi.niveaux().then((res: any) => {
      if (res) setNiveaux((res as any[]).map((n: any) => n.niveau));
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (data) setLocalItems(data.items);
  }, [data]);

  const handleNiveauChange = (n: string) => {
    setNiveau(n);
    setPage(1);
  };

  const handleUpdated = (updated: Matiere) => {
    setLocalItems(prev => prev ? prev.map(m => m.id === updated.id ? { ...m, ...updated } : m) : prev);
  };

  const handleDelete = (id: string) => {
    setLocalItems(prev => prev ? prev.filter(m => m.id !== id) : prev);
  };

  if (loading || !data) return <PageLoader />;
  if (error) return <Alert variant="error">Problème de chargement des matières.</Alert>;

  const { total, totalPages } = data;
  const items = localItems ?? data.items;

  const niveauxOptions: SelectOption[] = [
    { value: '', label: 'Tous les niveaux' },
    ...niveaux.map(n => ({ value: n, label: n })),
  ];

  return (
    <div>
      <PageHeader title="Matières" subtitle={`${total} matière(s)`}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ minWidth: 180 }}>
            <Select
              options={niveauxOptions}
              value={niveau}
              onChange={e => handleNiveauChange(e.target.value)}
              label=""
              fullWidth={false}
            />
          </div>
          <ExportMenu
            csvUrl={`/export/matieres/csv${niveau ? `?niveau=${encodeURIComponent(niveau)}` : ''}`}
            xlsxUrl={`/export/matieres/xlsx${niveau ? `?niveau=${encodeURIComponent(niveau)}` : ''}`}
          />
          {!readOnly && <Button as="link" to="/matieres/nouvelle" variant="primary">+ Nouvelle matière</Button>}
        </div>
      </PageHeader>

      {total === 0 ? (
        <EmptyState
          icon={<Icon path={Icons.book} size={28} />}
          message={niveau ? `Aucune matière pour le niveau ${niveau}` : 'Aucune matière'}
          action={!readOnly ? <Button as="link" to="/matieres/nouvelle" variant="primary">Créer</Button> : undefined}
        />
      ) : (
        <>
          <div className="matieres-grid">
            {items.map((m: Matiere) => (
              <MatiereCard
                key={m.id}
                matiere={m}
                niveaux={niveaux}
                onDelete={handleDelete}
                onUpdated={handleUpdated}
                readOnly={readOnly}
              />
            ))}
            {!readOnly && page === totalPages && <AddCard to="/matieres/nouvelle" label="Nouvelle matière" />}
          </div>
          <Pagination currentPage={page} totalItems={total} pageSize={8} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}
