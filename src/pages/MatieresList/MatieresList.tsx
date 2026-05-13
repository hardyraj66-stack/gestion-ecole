import { useState } from 'react';
import { useMatieres } from '../../contexts/MatiereContext';
import { useData } from '../../hooks/useData';
import { PageHeader } from '../../components/ui/PageHeader';
import { PageLoader } from '../../components/ui/PageLoader';
import { EmptyState } from '../../components/ui/EmptyState';
import { Button } from '../../components/shared/Button';
import { AddCard } from '../../components/shared/Card';
import { Icon, Icons } from '../../components/shared/Icon';
import { Pagination, paginate } from '../../components/shared/Pagination';
import { MatiereCard } from './MatiereCard';

const PAGE_SIZE = 8;

export function MatieresList() {
  const { delete: deleteMatiere } = useMatieres();
  const { matieres, loading, readOnly } = useData();
  const [page, setPage] = useState(1);

  const paged = paginate(matieres, page, PAGE_SIZE);

  if (loading) return <PageLoader />;

  return (
    <div>
      <PageHeader title="Matières" subtitle={`${matieres.length} matière(s) au programme`}>
        {!readOnly && (
          <Button as="link" to="/matieres/nouvelle" variant="primary">+ Nouvelle matière</Button>
        )}
      </PageHeader>

      {matieres.length === 0 ? (
        <EmptyState icon={<Icon path={Icons.book} size={28} />} message="Aucune matière créée"
          action={!readOnly ? <Button as="link" to="/matieres/nouvelle" variant="primary">Créer une matière</Button> : undefined} />
      ) : (
        <>
          <div className="matieres-grid">
            {paged.map(m => (
              <MatiereCard key={m.id} matiere={m} onDelete={readOnly ? () => {} : deleteMatiere} readOnly={readOnly} />
            ))}
            {!readOnly && page === Math.ceil(matieres.length / PAGE_SIZE) && (
              <AddCard to="/matieres/nouvelle" label="Nouvelle matière" />
            )}
          </div>
          <Pagination currentPage={page} totalItems={matieres.length} pageSize={PAGE_SIZE} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}
