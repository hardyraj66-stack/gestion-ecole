import { Classe } from '../../types';
import { FilterBar } from '../../components/shared/FilterBar';
import { SearchInput } from '../../components/shared/SearchInput';
import { SelectOption } from '../../components/shared/Select';

interface ElevesFiltersBarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  selectedClasseId: string;
  onClasseChange: (value: string) => void;
  classes: Classe[];
  count: number;
}

export function ElevesFiltersBar({ 
  searchTerm, 
  onSearchChange, 
  selectedClasseId, 
  onClasseChange,
  classes,
  count 
}: ElevesFiltersBarProps) {
  const classeOptions: SelectOption[] = classes.map(c => ({
    value: c.id,
    label: c.nom,
  }));

  return (
    <FilterBar count={count} countLabel="élève(s)">
      <SearchInput
        placeholder="Rechercher par nom ou prénom…"
        value={searchTerm}
        onSearch={onSearchChange}
      />

      <select
        value={selectedClasseId}
        onChange={(e) => onClasseChange(e.target.value)}
        className="select"
        style={{ minWidth: '200px' }}
      >
        <option value="">Toutes les classes</option>
        {classeOptions.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </FilterBar>
  );
}
