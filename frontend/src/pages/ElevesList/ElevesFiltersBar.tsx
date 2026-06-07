import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { readApi } from '../../services/readApi';
import { useViewing } from '../../contexts/ViewingContext';
import { FilterBar } from '../../components/shared/FilterBar';
import { NiveauClassePopover } from '../../components/shared/NiveauClassePopover';
import { SearchInputSuggestions, Suggestion } from '../../components/shared/SearchInputSuggestions';
import { Icon } from '../../components/shared/Icon';
import { Button } from '../../components/shared/Button';

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
  sansClasse: boolean;
  onSansClasseChange: (v: boolean) => void;
  hasAnneeActive: boolean;
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
  hasAnneeActive,
  count,
  hasEleveFilter,
  sansClasse,
  onSansClasseChange,
}: ElevesFiltersBarProps) {
  const { t } = useTranslation();
  const { viewingId } = useViewing();

  const fetchSuggestions = useCallback(async (query: string): Promise<Suggestion[]> => {
    const data = await readApi.elevesList(1, 8, query, '', undefined, viewingId ?? undefined);
    if (!data?.eleves) return [];
    return (data.eleves as any[]).map((e: any) => ({
      id: e.id,
      label: `${e.prenom} ${e.nom}`,
      sublabel: e.classe_nom || undefined,
    }));
  }, [viewingId]);

  const handleSuggestionSelect = (s: Suggestion) => {
    onSuggestionSelect(s.id);
  };

  const hasFilter = !!selectedClasseId || !!searchTerm || hasEleveFilter || sansClasse;

  return (
    <FilterBar count={count} countLabel={t('elevesFiltersBar.eleveS')}>
      <SearchInputSuggestions
        placeholder={t('elevesFiltersBar.rechercherPlaceholder')}
        value={searchTerm}
        onChange={onSearchChange}
        onSelect={handleSuggestionSelect}
        fetchSuggestions={fetchSuggestions}
        disabled={sansClasse}
      />

      {!sansClasse && (
        <NiveauClassePopover
          selectedNiveau={selectedNiveau}
          selectedClasseId={selectedClasseId}
          selectedClasseNom={selectedClasseNom}
          onChange={onNiveauClasseChange}
          showCapacite={true}
        />
      )}

      {hasAnneeActive && (
        <Button
          variant={sansClasse ? 'primary' : 'outline'}
          size="sm"
          onClick={() => onSansClasseChange(!sansClasse)}
        >
          À réinscrire
        </Button>
      )}

      {hasFilter && (
        <button type="button" className="filter-reset-btn" onClick={onReset}>
          <Icon path="M6 18L18 6M6 6l12 12" size={14} /> {t('common.effacer')}
        </button>
      )}
    </FilterBar>
  );
}
