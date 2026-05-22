import { useCallback } from 'react';
import { readApi } from '../../services/readApi';
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
  // Suggestions de recherche : filtre côté client sur les noms
  const fetchSuggestions = useCallback(async (query: string): Promise<Suggestion[]> => {
    const data = await readApi.elevesList(1, 8, query, '');
    if (!data?.eleves) return [];
    return (data.eleves as any[]).map((e: any) => ({
      id: e.id,
      label: `${e.prenom} ${e.nom}`,
      sublabel: e.classe_nom || undefined,
    }));
  }, []);

  const handleSuggestionSelect = (s: Suggestion) => {
    onSuggestionSelect(s.id);
  };

  const hasFilter = !!selectedClasseId || !!searchTerm || hasEleveFilter;

  return (
    <FilterBar count={count} countLabel="élève(s)">
      {/* Recherche avec auto-complétion */}
      <SearchInputSuggestions
        placeholder="Rechercher par nom ou prénom…"
        value={searchTerm}
        onChange={onSearchChange}
        onSelect={handleSuggestionSelect}
        fetchSuggestions={fetchSuggestions}
      />

      {/* Filtre Niveau → Classe */}
      <NiveauClassePopover
        selectedNiveau={selectedNiveau}
        selectedClasseId={selectedClasseId}
        selectedClasseNom={selectedClasseNom}
        onChange={onNiveauClasseChange}
        showCapacite={true}
      />

      {/* Réinitialiser */}
      {hasFilter && (
        <button type="button" className="filter-reset-btn" onClick={onReset}>
          <Icon path="M6 18L18 6M6 6l12 12" size={14} /> Réinitialiser
        </button>
      )}
    </FilterBar>
  );
}
