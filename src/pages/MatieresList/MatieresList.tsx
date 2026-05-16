import { useState } from 'react';
import { useMatieres } from '../../contexts/MatiereContext';
import { useViewing } from '../../contexts/ViewingContext';
import { useMatieresListData } from '../../hooks/usePageData';
import { PageHeader } from '../../components/ui/PageHeader';
import { PageLoader } from '../../components/ui/PageLoader';
import { EmptyState } from '../../components/ui/EmptyState';
import { Button } from '../../components/shared/Button';
import { AddCard } from '../../components/shared/Card';
import { Icon, Icons } from '../../components/shared/Icon';
import { Pagination } from '../../components/shared/Pagination';
import { Alert } from '../../components/shared/Alert';
import { MatiereCard } from './MatiereCard';

export function MatieresList() {
  const { delete: deleteMatiere } = useMatieres();
  const { isViewingArchive: readOnly } = useViewing();
  const [page, setPage] = useState(1);

  const { data, loading, error } = useMatieresListData(page);

  if (loading || !data) return <PageLoader />;
  if (error) return <Alert variant="error">Problème de chargement des matières.</Alert>;

  const { items, total, totalPages } = data;

  return (
    <div>
      <PageHeader title="Matières" subtitle={`${total} matière(s)`}>
        {!readOnly && <Button as="link" to="/matieres/nouvelle" variant="primary">+ Nouvelle matière</Button>}
      </PageHeader>

      {total === 0 ? (
        <EmptyState icon={<Icon path={Icons.book} size={28} />} message="Aucune matière"
          action={!readOnly ? <Button as="link" to="/matieres/nouvelle" variant="primary">Créer</Button> : undefined} />
      ) : (
        <>
          <div className="matieres-grid">
            {items.map((m: any) => <MatiereCard key={m.id} matiere={m} onDelete={readOnly ? () => {} : deleteMatiere} readOnly={readOnly} />)}
            {!readOnly && page === totalPages && <AddCard to="/matieres/nouvelle" label="Nouvelle matière" />}
          </div>
          <Pagination currentPage={page} totalItems={total} pageSize={8} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}
