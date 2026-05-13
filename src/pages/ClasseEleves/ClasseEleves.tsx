import { useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useEleves } from '../../contexts/EleveContext';
import { useData } from '../../hooks/useData';
import { PageHeader } from '../../components/ui/PageHeader';
import { PageLoader } from '../../components/ui/PageLoader';
import { EmptyState } from '../../components/ui/EmptyState';
import { Button } from '../../components/shared/Button';
import { Icon, Icons } from '../../components/shared/Icon';
import { ClasseInfoBar } from './ClasseInfoBar';
import { ElevesTable } from './ElevesTable';

export function ClasseEleves() {
  const { id } = useParams<{ id: string }>();
  const { delete: deleteEleve } = useEleves();
  const { classes, eleves, loading, readOnly } = useData();

  const [searchTerm, setSearchTerm] = useState('');

  const classe = useMemo(() => classes.find(c => c.id === id), [classes, id]);

  const classeEleves = useMemo(() => {
    return eleves.filter(e => e.classe_id === id);
  }, [eleves, id]);

  const filteredEleves = useMemo(() => {
    if (!searchTerm.trim()) return classeEleves;
    const term = searchTerm.toLowerCase();
    return classeEleves.filter(e =>
      e.nom.toLowerCase().includes(term) ||
      e.prenom.toLowerCase().includes(term)
    );
  }, [classeEleves, searchTerm]);

  if (loading) return <PageLoader />;

  if (!classe) {
    return (
      <EmptyState
        icon={<Icon path={Icons.warning} size={28} />}
        message="Classe introuvable"
        action={<Button as="link" to="/classes" variant="primary">Retour aux classes</Button>}
      />
    );
  }

  return (
    <div>
      <PageHeader
        title={`${classe.nom} — Liste des élèves`}
        subtitle={`Année scolaire ${classe.annee_scolaire}`}
      >
        <Button as="link" to="/classes" variant="secondary">← Classes</Button>
        <Button as="link" to={`/classes/${id}/planning`} variant="outline">📅 Planning</Button>
        {!readOnly && (
          <Button as="link" to="/eleves/nouveau" variant="primary">+ Nouvel élève</Button>
        )}
      </PageHeader>

      <ClasseInfoBar
        classe={classe}
        filteredCount={filteredEleves.length}
        totalCount={classeEleves.length}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
      />

      {classeEleves.length === 0 ? (
        <EmptyState
          icon={<Icon path={Icons.users} size={28} />}
          message="Aucun élève dans cette classe"
          action={!readOnly ? <Button as="link" to="/eleves/nouveau" variant="primary">Inscrire un élève</Button> : undefined}
        />
      ) : filteredEleves.length === 0 ? (
        <EmptyState
          icon={<Icon path={Icons.search} size={28} />}
          message="Aucun élève ne correspond à votre recherche"
        />
      ) : (
        <ElevesTable
          key={searchTerm}
          eleves={filteredEleves}
          onDelete={readOnly ? () => {} : deleteEleve}
          readOnly={readOnly}
        />
      )}
    </div>
  );
}
