import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { readApi } from '../../services/readApi';
import { useViewing } from '../../contexts/ViewingContext';
import { FilterBar } from '../../components/shared/FilterBar';
import { NiveauClassePopover } from '../../components/shared/NiveauClassePopover';
import { SearchInputSuggestions, Suggestion } from '../../components/shared/SearchInputSuggestions';
import { Icon } from '../../components/shared/Icon';

interface ElevesFiltersBarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onSuggestionSelect: (eleveId: string) => void;
  selectedClasseId: string;
  selectedClasseNom: string;
  selectedNiveau: string;
  onNiveauClasseChange: (niveauLabel: string, classeId: string, classeNom: string) => void;
  onReset: () => void;
  count: number;
  hasEleveFilter: boolean;
}

export function ElevesFiltersBar({
  searchTerm,
  onSearchChange,
  onSuggestionSelect,
  selectedClasseId,
  selectedClasseNom,
  selectedNiveau,
  onNiveauClasseChange,
  onReset,
  count,
  hasEleveFilter,
}: ElevesFiltersBarProps) {
  const { t } = useTranslation();
  const { viewingLabel } = useViewing();

  const fetchSuggestions = useCallback(async (query: string): Promise<Suggestion[]> => {
    const data = await readApi.elevesList(1, 8, query, '', undefined, viewingLabel ?? undefined);
    if (!data?.eleves) return [];
    return (data.eleves as any[]).map((e: any) => ({
      id: e.id,
      label: `${e.prenom} ${e.nom}`,
      sublabel: e.classe_nom || undefined,
    }));
  }, [viewingLabel]);

  const handleSuggestionSelect = (s: Suggestion) => {
    onSuggestionSelect(s.id);
  };

  const hasFilter = !!selectedClasseId || !!searchTerm || hasEleveFilter;

  return (
    <FilterBar count={count} countLabel={t('elevesFiltersBar.eleveS')}>
      <SearchInputSuggestions
        placeholder={t('elevesFiltersBar.rechercherPlaceholder')}
        value={searchTerm}
        onChange={onSearchChange}
        onSelect={handleSuggestionSelect}
        fetchSuggestions={fetchSuggestions}
      />

      <NiveauClassePopover
        selectedNiveau={selectedNiveau}
        selectedClasseId={selectedClasseId}
        selectedClasseNom={selectedClasseNom}
        onChange={onNiveauClasseChange}
        showCapacite={true}
      />

      {hasFilter && (
        <button type="button" className="filter-reset-btn" onClick={onReset}>
          <Icon path="M6 18L18 6M6 6l12 12" size={14} /> {t('common.effacer')}
        </button>
      )}
    </FilterBar>
  );
}
