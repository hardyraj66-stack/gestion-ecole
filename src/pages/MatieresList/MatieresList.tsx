import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useViewing } from '../../contexts/ViewingContext';
import { useReadOnly } from '../../hooks/useReadOnly';
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
  const { t } = useTranslation();
  const { isViewingArchive } = useViewing();
  const readOnly = useReadOnly();
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
  if (error) return <Alert variant="error">{t('matieres.erreurChargement')}</Alert>;

  const { total, totalPages } = data;
  const items = localItems ?? data.items;

  const niveauxOptions: SelectOption[] = [
    { value: '', label: t('matieres.tousNiveaux') },
    ...niveaux.map(n => ({ value: n, label: n })),
  ];

  return (
    <div>
      <PageHeader title={t('matieres.titre')} subtitle={t('matieres.nbMatieres', { count: total })}>
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
          {!readOnly && <Button as="link" to="/matieres/nouvelle" variant="primary">{t('matieres.nouvelleMatieres')}</Button>}
        </div>
      </PageHeader>

      {total === 0 ? (
        <EmptyState
          icon={<Icon path={Icons.book} size={28} />}
          message={niveau ? t('matieres.aucuneMatiereNiveau', { niveau }) : t('matieres.aucuneMatiere')}
          action={!readOnly ? <Button as="link" to="/matieres/nouvelle" variant="primary">{t('matieres.creer')}</Button> : undefined}
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
            {!readOnly && page === totalPages && <AddCard to="/matieres/nouvelle" label={t('matieres.nouvelleMatieres')} />}
          </div>
          <Pagination currentPage={page} totalItems={total} pageSize={8} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}
