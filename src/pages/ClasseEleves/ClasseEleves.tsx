import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useEleves } from '../../contexts/EleveContext';
import { useViewing } from '../../contexts/ViewingContext';
import { useClasseElevesData } from '../../hooks/usePageData';
import { PageHeader } from '../../components/ui/PageHeader';
import { PageLoader } from '../../components/ui/PageLoader';
import { EmptyState } from '../../components/ui/EmptyState';
import { Button } from '../../components/shared/Button';
import { Icon, Icons } from '../../components/shared/Icon';
import { Pagination } from '../../components/shared/Pagination';
import { Alert } from '../../components/shared/Alert';
import { ClasseInfoBar } from './ClasseInfoBar';
import { ElevesTable } from './ElevesTable';

export function ClasseEleves() {
  const { id } = useParams<{ id: string }>();
  const { delete: deleteEleve } = useEleves();
  const { isViewingArchive: readOnly } = useViewing();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  const { data, loading, error } = useClasseElevesData(id || '', page, search);

  if (loading || !data) return <PageLoader />;
  if (error) return <Alert variant="error">Problème de chargement.</Alert>;

  const { classe, eleves, total } = data;
  const handleSearch = (s: string) => { setSearch(s); setPage(1); };

  return (
    <div>
      <PageHeader title={`${classe.nom} — Liste des élèves`} subtitle={`Année scolaire ${classe.annee_scolaire}`}>
        <Button as="link" to="/classes" variant="secondary">← Classes</Button>
        <Button as="link" to={`/classes/${id}/planning`} variant="outline">📅 Planning</Button>
        {!readOnly && <Button as="link" to="/eleves/nouveau" variant="primary">+ Nouvel élève</Button>}
      </PageHeader>

      <ClasseInfoBar classe={classe} filteredCount={total} totalCount={classe.nb_eleves || total} searchTerm={search} onSearchChange={handleSearch} />

      {classe.nb_eleves === 0 && !search ? (
        <EmptyState icon={<Icon path={Icons.users} size={28} />} message="Aucun élève dans cette classe"
          action={!readOnly ? <Button as="link" to="/eleves/nouveau" variant="primary">Inscrire</Button> : undefined} />
      ) : total === 0 ? (
        <EmptyState icon={<Icon path={Icons.search} size={28} />} message="Aucun élève ne correspond" />
      ) : (
        <>
          <ElevesTable eleves={eleves} onDelete={readOnly ? () => {} : deleteEleve} readOnly={readOnly} />
          <Pagination currentPage={page} totalItems={total} pageSize={10} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}
