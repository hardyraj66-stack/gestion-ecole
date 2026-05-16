import { useState } from 'react';
import { useClasses } from '../../contexts/ClasseContext';
import { useViewing } from '../../contexts/ViewingContext';
import { useClassesListData } from '../../hooks/usePageData';
import { PageHeader } from '../../components/ui/PageHeader';
import { PageLoader } from '../../components/ui/PageLoader';
import { EmptyState } from '../../components/ui/EmptyState';
import { Button } from '../../components/shared/Button';
import { AddCard } from '../../components/shared/Card';
import { Icon, Icons } from '../../components/shared/Icon';
import { Pagination } from '../../components/shared/Pagination';
import { Alert } from '../../components/shared/Alert';
import { ClasseCard } from './ClasseCard';

export function ClassesList() {
  const { delete: deleteClasse } = useClasses();
  const { isViewingArchive: readOnly } = useViewing();
  const [page, setPage] = useState(1);

  const { data, loading, error } = useClassesListData(page);

  if (loading) return <PageLoader />;
  if (error || !data) return <Alert variant="error">Problème de chargement des classes.</Alert>;

  const { items, total, totalPages } = data;

  return (
    <div>
      <PageHeader title="Classes" subtitle={`${total} classe(s)`}>
        {!readOnly && <Button as="link" to="/classes/nouvelle" variant="primary">+ Nouvelle classe</Button>}
      </PageHeader>

      {total === 0 ? (
        <EmptyState icon={<Icon path={Icons.building} size={28} />} message="Aucune classe créée"
          action={!readOnly ? <Button as="link" to="/classes/nouvelle" variant="primary">Créer une classe</Button> : undefined} />
      ) : (
        <>
          <div className="classes-grid">
            {items.map((c: any) => <ClasseCard key={c.id} classe={c} onDelete={readOnly ? () => {} : deleteClasse} readOnly={readOnly} />)}
            {!readOnly && page === totalPages && <AddCard to="/classes/nouvelle" label="Nouvelle classe" />}
          </div>
          <Pagination currentPage={page} totalItems={total} pageSize={8} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}
