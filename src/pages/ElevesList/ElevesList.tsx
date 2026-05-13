import { useState, useMemo } from 'react';
import { useEleves } from '../../contexts/EleveContext';
import { useData } from '../../hooks/useData';
import { PageHeader } from '../../components/ui/PageHeader';
import { PageLoader } from '../../components/ui/PageLoader';
import { EmptyState } from '../../components/ui/EmptyState';
import { Button } from '../../components/shared/Button';
import { Icon, Icons } from '../../components/shared/Icon';
import { ElevesFiltersBar } from './ElevesFiltersBar';
import { ElevesListTable } from './ElevesListTable';

export function ElevesList() {
  const { delete: deleteEleve } = useEleves();
  const { classes, eleves, loading, readOnly } = useData();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClasseId, setSelectedClasseId] = useState('');

  const filteredEleves = useMemo(() => {
    let result = eleves;
    if (selectedClasseId) result = result.filter(e => e.classe_id === selectedClasseId);
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(e => e.nom.toLowerCase().includes(term) || e.prenom.toLowerCase().includes(term));
    }
    return result;
  }, [eleves, searchTerm, selectedClasseId]);

  if (loading) return <PageLoader />;

  return (
    <div>
      <PageHeader title="Élèves" subtitle={`${eleves.length} élève(s) inscrit(s)`}>
        {!readOnly && (
          <Button as="link" to="/eleves/nouveau" variant="primary">+ Nouvel élève</Button>
        )}
      </PageHeader>

      <ElevesFiltersBar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        selectedClasseId={selectedClasseId}
        onClasseChange={setSelectedClasseId}
        classes={classes}
        count={filteredEleves.length}
      />

      {eleves.length === 0 ? (
        <EmptyState icon={<Icon path={Icons.users} size={28} />} message="Aucun élève inscrit"
          action={!readOnly ? <Button as="link" to="/eleves/nouveau" variant="primary">Inscrire un élève</Button> : undefined}
        />
      ) : filteredEleves.length === 0 ? (
        <EmptyState icon={<Icon path={Icons.search} size={28} />} message="Aucun élève ne correspond à votre recherche" />
      ) : (
        <ElevesListTable
          key={`${searchTerm}-${selectedClasseId}`}
          eleves={filteredEleves}
          classes={classes}
          onDelete={readOnly ? () => {} : deleteEleve}
          readOnly={readOnly}
        />
      )}
    </div>
  );
}
