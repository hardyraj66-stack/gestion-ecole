import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useSalles } from '../../contexts/SalleContext';
import { useViewing } from '../../contexts/ViewingContext';
import { useReadOnly } from '../../hooks/useReadOnly';
import { useSallesListData } from '../../hooks/usePageData';
import { PageHeader } from '../../components/ui/PageHeader';
import { PageLoader } from '../../components/ui/PageLoader';
import { EmptyState } from '../../components/ui/EmptyState';
import { Alert } from '../../components/shared/Alert';
import { Button } from '../../components/shared/Button';
import { Icon, Icons } from '../../components/shared/Icon';
import { Pagination } from '../../components/shared/Pagination';
import { SalleCard } from './SalleCard';
import { SalleEditModal } from './SalleEditModal';
import { SalleDetailModal } from './SalleDetailModal';
import { Salle, TypeSalle, TYPES_SALLE } from '../../types';
import { API_BASE_URL } from '../../config/api';
import { useConfirm } from '../../components/shared/ConfirmDialog';
import { ExportMenu } from '../../components/shared/ExportMenu';

const typeColors: Record<TypeSalle, string> = {
  standard:    'var(--primary)',
  laboratoire: 'var(--secondary)',
  informatique:'var(--info)',
  sport:       'var(--success)',
  arts:        'var(--secondary)',
  amphi:       'var(--warning)',
  autre:       'var(--text-muted)',
};

export function SallesList() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isViewingArchive } = useViewing();
  const readOnly = useReadOnly();
  const { delete: deleteSalle } = useSalles();
  const confirm = useConfirm();

  const [page, setPage] = useState(1);
  const [filterType, setFilterType] = useState('');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [editingSalle, setEditingSalle] = useState<Salle | null>(null);
  const [detailSalle, setDetailSalle] = useState<Salle | null>(null);

  const { data, loading, error } = useSallesListData(page, filterType, search);

  const applySearch = useCallback(() => {
    setPage(1);
    setSearch(searchInput);
  }, [searchInput]);

  const handleFilterType = (typ: string) => {
    setFilterType(typ);
    setPage(1);
  };

  const handleDelete = async (salle: Salle) => {
    const checkRes = await fetch(`${API_BASE_URL}/salles/${salle.id}/usage`);
    const usage = checkRes.ok ? await checkRes.json() : { utilisee: false, creneaux_actifs: 0 };

    if (usage.utilisee) {
      const ok = await confirm({
        title: t('salles.salleUtilisee'),
        message: t('salles.confirmSupprUsage', { nom: salle.nom, count: usage.creneaux_actifs }),
        confirmText: t('salles.supprimerQuandMeme'),
        variant: 'danger',
      });
      if (!ok) return;
      await fetch(`${API_BASE_URL}/salles/${salle.id}?force=true`, { method: 'DELETE' });
    } else {
      const ok = await confirm({
        title: t('salles.supprimer'),
        message: t('salles.confirmSupprimerSalle', { nom: salle.nom }),
        confirmText: t('salles.supprimerBtn'),
        variant: 'danger',
      });
      if (!ok) return;
      await deleteSalle(salle.id);
    }
  };

  if (loading || !data) return <PageLoader />;
  if (error) return <Alert variant="error">{t('salles.erreur')}</Alert>;

  const { items, total } = data;

  return (
    <div>
      <PageHeader title={t('salles.titre')} subtitle={t('salles.nbSalles', { count: total })}>
        <ExportMenu
          csvUrl={`/export/salles/csv${filterType ? `?type=${filterType}` : ''}`}
          xlsxUrl={`/export/salles/xlsx${filterType ? `?type=${filterType}` : ''}`}
        />
        {!readOnly && (
          <Button variant="primary" onClick={() => navigate('/salles/nouvelle')}>
            {t('salles.nouvelleSalle')}
          </Button>
        )}
      </PageHeader>

      {readOnly && <Alert variant="warning" icon={false}>{t('salles.archiveLecture')}</Alert>}

      <div className="salles-filters">
        <div className="salles-search">
          <input
            className="input"
            placeholder={t('salles.rechercher')}
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && applySearch()}
            style={{ maxWidth: 240 }}
          />
          <Button variant="outline" size="sm" onClick={applySearch}>{t('salles.effectuerRecherche')}</Button>
          {search && (
            <Button variant="outline" size="sm" onClick={() => { setSearch(''); setSearchInput(''); setPage(1); }}>
              {t('salles.effacer')}
            </Button>
          )}
        </div>
        <div className="salles-type-filters">
          <button
            className={`salle-filter-btn${filterType === '' ? ' active' : ''}`}
            onClick={() => handleFilterType('')}
          >{t('salles.tous')}</button>
          {TYPES_SALLE.map(typ => (
            <button
              key={typ.value}
              className={`salle-filter-btn${filterType === typ.value ? ' active' : ''}`}
              style={filterType === typ.value ? { borderColor: typeColors[typ.value as TypeSalle], color: typeColors[typ.value as TypeSalle], background: `${typeColors[typ.value as TypeSalle]}12` } : {}}
              onClick={() => handleFilterType(typ.value)}
            >
              {typ.label}
            </button>
          ))}
        </div>
      </div>

      {total === 0 ? (
        <EmptyState
          icon={<Icon path={Icons.building} size={28} />}
          message={search || filterType ? t('salles.aucuneSalleFiltres') : t('salles.aucuneSalle')}
          action={!readOnly && !search && !filterType ? (
            <Button variant="primary" onClick={() => navigate('/salles/nouvelle')}>{t('salles.creerSalle')}</Button>
          ) : undefined}
        />
      ) : (
        <>
          <div className="salles-grid">
            {items.map((s: Salle) => (
              <SalleCard
                key={s.id}
                salle={s}
                onEdit={readOnly ? () => {} : () => setEditingSalle(s)}
                onDelete={readOnly ? () => {} : () => handleDelete(s)}
                onView={() => setDetailSalle(s)}
                readOnly={readOnly}
              />
            ))}
          </div>
          <Pagination currentPage={page} totalItems={total} pageSize={10} onPageChange={setPage} />
        </>
      )}

      {editingSalle && (
        <SalleEditModal salle={editingSalle} onClose={() => setEditingSalle(null)} />
      )}
      {detailSalle && (
        <SalleDetailModal
          salle={detailSalle}
          onClose={() => setDetailSalle(null)}
          onEdit={!readOnly ? () => { setDetailSalle(null); setEditingSalle(detailSalle); } : undefined}
        />
      )}
    </div>
  );
}
