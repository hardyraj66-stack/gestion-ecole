import { Classe, Matiere, Trimestre } from '../../types';
import { Card } from '../../components/shared/Card';
import { Select, SelectOption } from '../../components/shared/Select';
import { Input } from '../../components/shared/Input';
import { Button } from '../../components/shared/Button';
import { FormGrid } from '../../components/shared/FormGrid';

interface NotesFiltersProps {
  classes: Classe[];
  matieres: Matiere[];
  selectedClasseId: string;
  selectedMatiereId: string;
  selectedTrimestre: Trimestre;
  selectedDate: string;
  onClasseChange: (id: string) => void;
  onMatiereChange: (id: string) => void;
  onTrimestreChange: (t: Trimestre) => void;
  onDateChange: (date: string) => void;
  onLoad: () => void;
  loading: boolean;
}

const TRIMESTRE_OPTIONS: SelectOption[] = [
  { value: 1, label: 'Trimestre 1' },
  { value: 2, label: 'Trimestre 2' },
  { value: 3, label: 'Trimestre 3' },
];

export function NotesFilters({
  classes,
  matieres,
  selectedClasseId,
  selectedMatiereId,
  selectedTrimestre,
  selectedDate,
  onClasseChange,
  onMatiereChange,
  onTrimestreChange,
  onDateChange,
  onLoad,
  loading,
}: NotesFiltersProps) {
  const isDisabled = !selectedClasseId || !selectedMatiereId;

  const classeOptions: SelectOption[] = classes.map(c => ({
    value: c.id,
    label: c.nom,
  }));

  const matiereOptions: SelectOption[] = matieres.map(m => ({
    value: m.id,
    label: m.nom,
  }));

  return (
    <Card style={{ marginBottom: '1.5rem' }}>
      <h3 className="card-title" style={{ marginBottom: '1rem' }}>Sélection</h3>
      
      <FormGrid columns={4}>
        <Select
          label="Classe *"
          value={selectedClasseId}
          onChange={(e) => onClasseChange(e.target.value)}
          options={classeOptions}
          placeholder="Choisir une classe"
        />

        <Select
          label="Matière *"
          value={selectedMatiereId}
          onChange={(e) => onMatiereChange(e.target.value)}
          options={matiereOptions}
          placeholder="Choisir une matière"
        />

        <Select
          label="Trimestre"
          value={selectedTrimestre}
          onChange={(e) => onTrimestreChange(Number(e.target.value) as Trimestre)}
          options={TRIMESTRE_OPTIONS}
        />

        <Input
          label="Date d'évaluation"
          type="date"
          value={selectedDate}
          onChange={(e) => onDateChange(e.target.value)}
        />
      </FormGrid>

      <div style={{ marginTop: '1rem' }}>
        <Button
          variant="primary"
          onClick={onLoad}
          disabled={isDisabled}
          loading={loading}
        >
          Charger les élèves →
        </Button>
      </div>
    </Card>
  );
}
