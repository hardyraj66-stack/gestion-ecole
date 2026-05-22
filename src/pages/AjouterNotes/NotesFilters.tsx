import { useState, useCallback } from 'react';
import { Matiere, Trimestre } from '../../types';
import { Card } from '../../components/shared/Card';
import { Select, SelectOption } from '../../components/shared/Select';
import { Button } from '../../components/shared/Button';
import { NiveauClassePopover } from '../../components/shared/NiveauClassePopover';
import { SearchInputSuggestions, Suggestion } from '../../components/shared/SearchInputSuggestions';

interface NotesFiltersProps {
  matieres: Matiere[];
  selectedClasseId: string;
  selectedClasseNom: string;
  selectedNiveau: string;
  selectedMatiereId: string;
  selectedMatiereName: string;
  selectedTrimestre: Trimestre;
  onNiveauClasseChange: (niveau: string, classeId: string, classeNom: string) => void;
  onMatiereChange: (id: string, nom: string) => void;
  onTrimestreChange: (t: Trimestre) => void;
  onLoad: () => void;
  loading: boolean;
}

const TRIMESTRE_OPTIONS: SelectOption[] = [
  { value: 1, label: 'Trimestre 1' },
  { value: 2, label: 'Trimestre 2' },
  { value: 3, label: 'Trimestre 3' },
];

export function NotesFilters({
  matieres,
  selectedClasseId,
  selectedClasseNom,
  selectedNiveau,
  selectedMatiereId,
  selectedMatiereName,
  selectedTrimestre,
  onNiveauClasseChange,
  onMatiereChange,
  onTrimestreChange,
  onLoad,
  loading,
}: NotesFiltersProps) {
  const [matiereQuery, setMatiereQuery] = useState(selectedMatiereName);

  const fetchMatieresSuggestions = useCallback(async (query: string): Promise<Suggestion[]> => {
    const q = query.toLowerCase();
    return matieres
      .filter(m => m.nom.toLowerCase().includes(q) || m.code.toLowerCase().includes(q))
      .slice(0, 8)
      .map(m => ({ id: m.id, label: m.nom, sublabel: m.code }));
  }, [matieres]);

  const handleMatiereSelect = (s: Suggestion) => {
    setMatiereQuery(s.label);
    onMatiereChange(s.id, s.label);
  };

  const handleMatiereQueryChange = (val: string) => {
    setMatiereQuery(val);
    if (!val) onMatiereChange('', '');
  };

  const isDisabled = !selectedClasseId || !selectedMatiereId;

  return (
    <Card style={{ marginBottom: '1.5rem' }}>
      <h3 className="card-title" style={{ marginBottom: '1rem' }}>Sélection</h3>

      <div className="notes-filters-row">
        {/* Sélection niveau → classe via popover */}
        <div className="notes-filter-group">
          <label className="notes-filter-label">Classe *</label>
          <NiveauClassePopover
            selectedNiveau={selectedNiveau}
            selectedClasseId={selectedClasseId}
            selectedClasseNom={selectedClasseNom}
            onChange={onNiveauClasseChange}
            showCapacite={false}
          />
        </div>

        {/* Recherche matière avec autocomplete */}
        <div className="notes-filter-group">
          <label className="notes-filter-label">Matière *</label>
          <SearchInputSuggestions
            placeholder="Rechercher une matière…"
            value={matiereQuery}
            onChange={handleMatiereQueryChange}
            onSelect={handleMatiereSelect}
            fetchSuggestions={fetchMatieresSuggestions}
            debounceMs={150}
          />
        </div>

        {/* Trimestre */}
        <div className="notes-filter-group">
          <label className="notes-filter-label">Trimestre</label>
          <Select
            label=""
            value={selectedTrimestre}
            onChange={e => onTrimestreChange(Number(e.target.value) as Trimestre)}
            options={TRIMESTRE_OPTIONS}
          />
        </div>

        {/* Bouton charger */}
        <div className="notes-filter-group notes-filter-action">
          <Button
            variant="primary"
            onClick={onLoad}
            disabled={isDisabled}
            loading={loading}
          >
            Charger les élèves →
          </Button>
        </div>
      </div>
    </Card>
  );
}
