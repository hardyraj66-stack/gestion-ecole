import { useState } from 'react';
import { useViewing } from '../../contexts/ViewingContext';
import { useElevesListData } from '../../hooks/usePageData';
import { PageHeader } from '../../components/ui/PageHeader';
import { PageLoader } from '../../components/ui/PageLoader';
import { EmptyState } from '../../components/ui/EmptyState';
import { Button } from '../../components/shared/Button';
import { Icon, Icons } from '../../components/shared/Icon';
import { Pagination } from '../../components/shared/Pagination';
import { Alert } from '../../components/shared/Alert';
import { ElevesFiltersBar } from './ElevesFiltersBar';
import { ElevesListTable } from './ElevesListTable';
import { ExportMenu } from '../../components/shared/ExportMenu';

export function ElevesList() {
  const { isViewingArchive: readOnly } = useViewing();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [classeId, setClasseId] = useState('');
  const [classeNom, setClasseNom] = useState('');
  const [niveau, setNiveau] = useState('');
  const [eleveId, setEleveId] = useState('');

  const { data, loading, error } = useElevesListData(page, search, classeId, eleveId);

  const eleves = data?.eleves || [];
  const total = data?.total || 0;
  const totalAll = data?.totalAll || 0;

  if (loading && !data) return <PageLoader />;
  if (error) return <Alert variant="error">Problème de chargement des élèves.</Alert>;

  const handleSearch = (s: string) => { setSearch(s); setEleveId(''); setPage(1); };
  const handleSuggestionSelect = (id: string) => { setEleveId(id); setSearch(''); setPage(1); };

  const handleNiveauClasseChange = (niveauLabel: string, cid: string, nom: string) => {
    setNiveau(niveauLabel);
    setClasseId(cid);
    setClasseNom(nom);
    setPage(1);
  };

  const handleReset = () => {
    setSearch('');
    setClasseId('');
    setClasseNom('');
    setNiveau('');
    setEleveId('');
    setPage(1);
  };

  return (
    <div>
      <PageHeader title="Élèves" subtitle={`${totalAll} élève(s) inscrit(s)`}>
        <ExportMenu
          csvUrl={`/export/eleves/csv${classeId ? `?classeId=${classeId}` : ''}${search ? `${classeId ? '&' : '?'}search=${encodeURIComponent(search)}` : ''}`}
          xlsxUrl={`/export/eleves/xlsx${classeId ? `?classeId=${classeId}` : ''}${search ? `${classeId ? '&' : '?'}search=${encodeURIComponent(search)}` : ''}`}
        />
        {!readOnly && <Button as="link" to="/eleves/nouveau" variant="primary">+ Nouvel élève</Button>}
      </PageHeader>

      <ElevesFiltersBar
        searchTerm={search}
        onSearchChange={handleSearch}
        onSuggestionSelect={handleSuggestionSelect}
        selectedClasseId={classeId}
        selectedClasseNom={classeNom}
        selectedNiveau={niveau}
        onNiveauClasseChange={handleNiveauClasseChange}
        onReset={handleReset}
        count={total}
        hasEleveFilter={!!eleveId}
      />

      {totalAll === 0 ? (
        <EmptyState
          icon={<Icon path={Icons.users} size={28} />}
          message="Aucun élève inscrit"
          action={!readOnly ? <Button as="link" to="/eleves/nouveau" variant="primary">Inscrire</Button> : undefined}
        />
      ) : total === 0 ? (
        <EmptyState icon={<Icon path={Icons.search} size={28} />} message="Aucun élève ne correspond" />
      ) : (
        <>
          <ElevesListTable eleves={eleves} />
          <Pagination currentPage={page} totalItems={total} pageSize={12} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}
