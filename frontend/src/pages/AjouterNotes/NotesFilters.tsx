import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Matiere } from '../../types';
import { Card } from '../../components/shared/Card';
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
  onNiveauClasseChange: (niveau: string, classeId: string, classeNom: string) => void;
  onMatiereChange: (id: string, nom: string) => void;
  onLoad: () => void;
  loading: boolean;
}

export function NotesFilters({
  matieres,
  selectedClasseId,
  selectedClasseNom,
  selectedNiveau,
  selectedMatiereId,
  selectedMatiereName,
  onNiveauClasseChange,
  onMatiereChange,
  onLoad,
  loading,
}: NotesFiltersProps) {
  const { t } = useTranslation();
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
      <h3 className="card-title" style={{ marginBottom: '1rem' }}>{t('notes.filtres.selection')}</h3>

      <div className="notes-filters-row">
        <div className="notes-filter-group">
          <label className="notes-filter-label">{t('notes.filtres.classe')}</label>
          <NiveauClassePopover
            selectedNiveau={selectedNiveau}
            selectedClasseId={selectedClasseId}
            selectedClasseNom={selectedClasseNom}
            onChange={onNiveauClasseChange}
            showCapacite={false}
          />
        </div>

        <div className="notes-filter-group">
          <label className="notes-filter-label">{t('notes.filtres.matiere')}</label>
          <SearchInputSuggestions
            placeholder={t('notes.filtres.rechercher')}
            value={matiereQuery}
            onChange={handleMatiereQueryChange}
            onSelect={handleMatiereSelect}
            fetchSuggestions={fetchMatieresSuggestions}
            debounceMs={150}
          />
        </div>

        <div className="notes-filter-group notes-filter-action">
          <Button
            variant="primary"
            onClick={onLoad}
            disabled={isDisabled}
            loading={loading}
          >
            {t('notes.filtres.charger')}
          </Button>
        </div>
      </div>
    </Card>
  );
}
