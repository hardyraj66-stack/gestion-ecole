import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useViewing } from '../../contexts/ViewingContext';
import { useAnneeScolaireStatus } from '../../hooks/useAnneeScolaireStatus';
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
import { ExportMenu } from '../../components/shared/ExportMenu';
import { exportQs } from '../../utils/helpers';

export function ClasseEleves() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const { isViewingArchive, viewingId } = useViewing();
  const { isTerminee } = useAnneeScolaireStatus();
  const readOnly = isViewingArchive || isTerminee;
  const [page, setPage] = useState(1);
  const [inputValue, setInputValue] = useState('');
  const [search, setSearch] = useState('');
  const [eleveId, setEleveId] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { data, loading, error, refreshing } = useClasseElevesData(id || '', page, search, eleveId);

  useEffect(() => () => { if (debounceRef.current) clearTimeout(debounceRef.current); }, []);

  if (loading || !data) return <PageLoader />;
  if (error) return <Alert variant="error">{t('common.erreurChargement')}</Alert>;

  const { classe, eleves, total } = data;

  const handleInputChange = (val: string) => {
    setInputValue(val);
    setEleveId('');
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!val) { setSearch(''); setPage(1); return; }
    debounceRef.current = setTimeout(() => { setSearch(val); setPage(1); }, 400);
  };

  const handleCommit = (val: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setSearch(val);
    setEleveId('');
    setPage(1);
  };

  const handleSuggestionSelect = (id: string, label: string) => {
    setInputValue(label);
    setEleveId(id);
    setSearch('');
    setPage(1);
  };

  const handleReset = () => {
    setInputValue('');
    setSearch('');
    setEleveId('');
    setPage(1);
  };

  return (
    <div>
      <PageHeader title={t('classeEleves.titre', { nom: classe.nom })} subtitle={`${classe.niveau} · ${t('classeEleves.annee', { annee: classe.annee_scolaire })}`}>

        <Button as="link" to="/classes" variant="secondary">{t('classeEleves.retourClasses')}</Button>
        <Button as="link" to={`/classes/${id}/planning`} variant="outline">{t('classes.actions.planning')}</Button>
        <ExportMenu
          csvUrl={`/export/classes/${id}/eleves/csv${exportQs({ anneeId: viewingId })}`}
          xlsxUrl={`/export/classes/${id}/eleves/xlsx${exportQs({ anneeId: viewingId })}`}
        />
        {!readOnly && <Button as="link" to="/eleves/nouveau" variant="primary">{t('eleves.nouvelEleve')}</Button>}
      </PageHeader>

      {isTerminee && !isViewingArchive && (
        <Alert variant="info" icon={false}>
          {t('layout.aucuneAnneeActive')} {t('layout.aucuneAnneeActiveMsg')}
        </Alert>
      )}

      <ClasseInfoBar
        classe={classe}
        filteredCount={total}
        totalCount={classe.nb_eleves || total}
        inputValue={inputValue}
        hasFilter={!!search || !!eleveId}
        onInputChange={handleInputChange}
        onCommit={handleCommit}
        onSuggestionSelect={handleSuggestionSelect}
        onReset={handleReset}
      />

      <div style={{ opacity: refreshing ? 0.5 : 1, transition: 'opacity 0.15s' }}>
        {classe.nb_eleves === 0 && !search && !eleveId ? (
          <EmptyState
            icon={<Icon path={Icons.users} size={28} />}
            message={t('eleves.aucunEleveClasse')}
            action={!readOnly ? <Button as="link" to="/eleves/nouveau" variant="primary">{t('eleves.inscrire')}</Button> : undefined}
          />
        ) : total === 0 ? (
          <EmptyState icon={<Icon path={Icons.search} size={28} />} message={t('eleves.aucunResultat')} />
        ) : (
          <>
            <ElevesTable eleves={eleves} />
            <Pagination currentPage={page} totalItems={total} pageSize={10} onPageChange={setPage} />
          </>
        )}
      </div>
    </div>
  );
}
