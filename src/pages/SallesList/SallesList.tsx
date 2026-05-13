import { useState } from 'react';
import { useSalles } from '../../contexts/SalleContext';
import { useViewing } from '../../contexts/ViewingContext';
import { PageHeader } from '../../components/ui/PageHeader';
import { PageLoader } from '../../components/ui/PageLoader';
import { EmptyState } from '../../components/ui/EmptyState';
import { Alert } from '../../components/shared/Alert';
import { Button } from '../../components/shared/Button';
import { AddCard } from '../../components/shared/Card';
import { Icon, Icons } from '../../components/shared/Icon';
import { Pagination, paginate } from '../../components/shared/Pagination';
import { SalleForm } from './SalleForm';
import { SalleCard } from './SalleCard';
import { Salle } from '../../types';

const PAGE_SIZE = 8;

export function SallesList() {
  const { salles, loading, delete: deleteSalle } = useSalles();
  const { isViewingArchive } = useViewing();
  const readOnly = isViewingArchive;

  const [showForm, setShowForm] = useState(false);
  const [editingSalle, setEditingSalle] = useState<Salle | null>(null);
  const [page, setPage] = useState(1);

  const paged = paginate(salles, page, PAGE_SIZE);

  const openCreate = () => { if (readOnly) return; setEditingSalle(null); setShowForm(true); };
  const openEdit = (salle: Salle) => { if (readOnly) return; setEditingSalle(salle); setShowForm(true); };
  const closeForm = () => { setShowForm(false); setEditingSalle(null); };

  if (loading) return <PageLoader />;

  return (
    <div>
      <PageHeader title="Salles" subtitle={`${salles.length} salle(s) enregistrée(s)`}>
        {!readOnly && !showForm && (
          <Button variant="primary" onClick={openCreate}>+ Nouvelle salle</Button>
        )}
      </PageHeader>

      {readOnly && (
        <Alert variant="warning" icon={false}>
          Vous consultez une année archivée. La gestion des salles est en lecture seule.
        </Alert>
      )}

      {showForm && !readOnly && <SalleForm editingSalle={editingSalle} onClose={closeForm} />}

      {salles.length === 0 && !showForm ? (
        <EmptyState icon={<Icon path={Icons.building} size={28} />} message="Aucune salle enregistrée"
          action={!readOnly ? <Button variant="primary" onClick={openCreate}>Créer une salle</Button> : undefined} />
      ) : (
        <>
          <div className="salles-grid">
            {paged.map(salle => (
              <SalleCard key={salle.id} salle={salle}
                onEdit={readOnly ? () => {} : openEdit}
                onDelete={readOnly ? () => {} : deleteSalle}
                readOnly={readOnly} />
            ))}
            {!readOnly && !showForm && page === Math.ceil(salles.length / PAGE_SIZE) && (
              <AddCard onClick={openCreate} label="Nouvelle salle" />
            )}
          </div>
          <Pagination currentPage={page} totalItems={salles.length} pageSize={PAGE_SIZE} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}
