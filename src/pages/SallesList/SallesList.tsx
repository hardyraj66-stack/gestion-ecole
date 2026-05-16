import { useState } from 'react';
import { useSalles } from '../../contexts/SalleContext';
import { useViewing } from '../../contexts/ViewingContext';
import { useSallesListData } from '../../hooks/usePageData';
import { PageHeader } from '../../components/ui/PageHeader';
import { PageLoader } from '../../components/ui/PageLoader';
import { EmptyState } from '../../components/ui/EmptyState';
import { Alert } from '../../components/shared/Alert';
import { Button } from '../../components/shared/Button';
import { AddCard } from '../../components/shared/Card';
import { Icon, Icons } from '../../components/shared/Icon';
import { Pagination } from '../../components/shared/Pagination';
import { SalleForm } from './SalleForm';
import { SalleCard } from './SalleCard';
import { Salle } from '../../types';

export function SallesList() {
  const { delete: deleteSalle } = useSalles();
  const { isViewingArchive: readOnly } = useViewing();
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editingSalle, setEditingSalle] = useState<Salle | null>(null);

  const { data, loading, error } = useSallesListData(page);

  if (loading || !data) return <PageLoader />;
  if (error) return <Alert variant="error">Problème de chargement des salles.</Alert>;

  const { items, total, totalPages } = data;
  const openCreate = () => { if (readOnly) return; setEditingSalle(null); setShowForm(true); };
  const openEdit = (s: Salle) => { if (readOnly) return; setEditingSalle(s); setShowForm(true); };
  const closeForm = () => { setShowForm(false); setEditingSalle(null); };

  return (
    <div>
      <PageHeader title="Salles" subtitle={`${total} salle(s)`}>
        {!readOnly && !showForm && <Button variant="primary" onClick={openCreate}>+ Nouvelle salle</Button>}
      </PageHeader>

      {readOnly && <Alert variant="warning" icon={false}>Archive — lecture seule</Alert>}
      {showForm && !readOnly && <SalleForm editingSalle={editingSalle} onClose={closeForm} />}

      {total === 0 && !showForm ? (
        <EmptyState icon={<Icon path={Icons.building} size={28} />} message="Aucune salle"
          action={!readOnly ? <Button variant="primary" onClick={openCreate}>Créer</Button> : undefined} />
      ) : (
        <>
          <div className="salles-grid">
            {items.map((s: any) => <SalleCard key={s.id} salle={s} onEdit={readOnly ? () => {} : openEdit} onDelete={readOnly ? () => {} : deleteSalle} readOnly={readOnly} />)}
            {!readOnly && !showForm && page === totalPages && <AddCard onClick={openCreate} label="Nouvelle salle" />}
          </div>
          <Pagination currentPage={page} totalItems={total} pageSize={8} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}
