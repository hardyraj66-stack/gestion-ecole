import { useMemo, useState } from 'react';
import { useClasses } from '../../contexts/ClasseContext';
import { useData } from '../../hooks/useData';
import { PageHeader } from '../../components/ui/PageHeader';
import { PageLoader } from '../../components/ui/PageLoader';
import { EmptyState } from '../../components/ui/EmptyState';
import { Button } from '../../components/shared/Button';
import { AddCard } from '../../components/shared/Card';
import { Icon, Icons } from '../../components/shared/Icon';
import { Pagination, paginate } from '../../components/shared/Pagination';
import { ClasseCard } from './ClasseCard';

const PAGE_SIZE = 8;

export function ClassesList() {
  const { delete: deleteClasse } = useClasses();
  const { classes, eleves, loading, readOnly } = useData();
  const [page, setPage] = useState(1);

  const classesWithCount = useMemo(() => {
    return classes.map(classe => {
      const nb_eleves = eleves.filter(e => e.classe_id === classe.id).length;
      const taux = Math.min(Math.round((nb_eleves / classe.capacite) * 100), 100);
      return { ...classe, nb_eleves, taux };
    });
  }, [classes, eleves]);

  const paged = paginate(classesWithCount, page, PAGE_SIZE);

  if (loading) return <PageLoader />;

  return (
    <div>
      <PageHeader
        title="Classes"
        subtitle={`${classes.length} classe(s) enregistrée(s)`}
      >
        {!readOnly && (
          <Button as="link" to="/classes/nouvelle" variant="primary">
            + Nouvelle classe
          </Button>
        )}
      </PageHeader>

      {classes.length === 0 ? (
        <EmptyState
          icon={<Icon path={Icons.building} size={28} />}
          message="Aucune classe créée"
          action={!readOnly ? (
            <Button as="link" to="/classes/nouvelle" variant="primary">Créer une classe</Button>
          ) : undefined}
        />
      ) : (
        <>
          <div className="classes-grid">
            {paged.map(classe => (
              <ClasseCard key={classe.id} classe={classe} onDelete={readOnly ? () => {} : deleteClasse} readOnly={readOnly} />
            ))}
            {!readOnly && page === Math.ceil(classesWithCount.length / PAGE_SIZE) && (
              <AddCard to="/classes/nouvelle" label="Nouvelle classe" />
            )}
          </div>
          <Pagination currentPage={page} totalItems={classesWithCount.length} pageSize={PAGE_SIZE} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}
