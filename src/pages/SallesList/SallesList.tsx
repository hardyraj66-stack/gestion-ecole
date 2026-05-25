import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSalles } from '../../contexts/SalleContext';
import { useViewing } from '../../contexts/ViewingContext';
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
  standard: '#2563eb',
  laboratoire: '#7c3aed',
  informatique: '#0891b2',
  sport: '#16a34a',
  arts: '#db2777',
  amphi: '#d97706',
  autre: '#64748b',
};

export function SallesList() {
  const navigate = useNavigate();
  const { isViewingArchive: readOnly } = useViewing();
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

  const handleFilterType = (t: string) => {
    setFilterType(t);
    setPage(1);
  };

  const handleDelete = async (salle: Salle) => {
    const checkRes = await fetch(`${API_BASE_URL}/salles/${salle.id}/usage`);
    const usage = checkRes.ok ? await checkRes.json() : { utilisee: false, creneaux_actifs: 0 };

    if (usage.utilisee) {
      const ok = await confirm({
        title: 'Salle utilisée dans le planning',
        message: `La salle « ${salle.nom} » est utilisée dans ${usage.creneaux_actifs} cours. Voulez-vous quand même la supprimer ? Les créneaux associés garderont leur ancienne référence.`,
        confirmText: 'Supprimer quand même',
        variant: 'danger',
      });
      if (!ok) return;
      await fetch(`${API_BASE_URL}/salles/${salle.id}?force=true`, { method: 'DELETE' });
    } else {
      const ok = await confirm({
        title: 'Supprimer la salle',
        message: `Êtes-vous sûr de vouloir supprimer « ${salle.nom} » ?`,
        confirmText: 'Supprimer',
        variant: 'danger',
      });
      if (!ok) return;
      await deleteSalle(salle.id);
    }
  };

  if (loading || !data) return <PageLoader />;
  if (error) return <Alert variant="error">Problème de chargement des salles.</Alert>;

  const { items, total } = data;

  return (
    <div>
      <PageHeader title="Salles" subtitle={`${total} salle(s)`}>
        <ExportMenu
          csvUrl={`/export/salles/csv${filterType ? `?type=${filterType}` : ''}`}
          xlsxUrl={`/export/salles/xlsx${filterType ? `?type=${filterType}` : ''}`}
        />
        {!readOnly && (
          <Button variant="primary" onClick={() => navigate('/salles/nouvelle')}>
            + Nouvelle salle
          </Button>
        )}
      </PageHeader>

      {readOnly && <Alert variant="warning" icon={false}>Archive — lecture seule</Alert>}

      {/* Filtres */}
      <div className="salles-filters">
        <div className="salles-search">
          <input
            className="input"
            placeholder="Rechercher une salle..."
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && applySearch()}
            style={{ maxWidth: 240 }}
          />
          <Button variant="outline" size="sm" onClick={applySearch}>Rechercher</Button>
          {search && (
            <Button variant="outline" size="sm" onClick={() => { setSearch(''); setSearchInput(''); setPage(1); }}>
              ✕ Effacer
            </Button>
          )}
        </div>
        <div className="salles-type-filters">
          <button
            className={`salle-filter-btn${filterType === '' ? ' active' : ''}`}
            onClick={() => handleFilterType('')}
          >Tous</button>
          {TYPES_SALLE.map(t => (
            <button
              key={t.value}
              className={`salle-filter-btn${filterType === t.value ? ' active' : ''}`}
              style={filterType === t.value ? { borderColor: typeColors[t.value as TypeSalle], color: typeColors[t.value as TypeSalle], background: `${typeColors[t.value as TypeSalle]}12` } : {}}
              onClick={() => handleFilterType(t.value)}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {total === 0 ? (
        <EmptyState
          icon={<Icon path={Icons.building} size={28} />}
          message={search || filterType ? 'Aucune salle ne correspond aux filtres' : 'Aucune salle'}
          action={!readOnly && !search && !filterType ? (
            <Button variant="primary" onClick={() => navigate('/salles/nouvelle')}>Créer une salle</Button>
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
