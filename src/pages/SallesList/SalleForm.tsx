import { useState, useEffect } from 'react';
import { Salle, TypeSalle, TYPES_SALLE } from '../../types';
import { useSalles } from '../../contexts/SalleContext';
import { Card } from '../../components/shared/Card';
import { Input } from '../../components/shared/Input';
import { Select, SelectOption } from '../../components/shared/Select';
import { Button } from '../../components/shared/Button';
import { Alert } from '../../components/shared/Alert';
import { FormGrid, FormActions } from '../../components/shared/FormGrid';

interface SalleFormProps {
  editingSalle: Salle | null;
  onClose: () => void;
}

const TYPE_OPTIONS: SelectOption[] = TYPES_SALLE.map(t => ({
  value: t.value,
  label: t.label,
}));

export function SalleForm({ editingSalle, onClose }: SalleFormProps) {
  const { create, update } = useSalles();

  const [nom, setNom] = useState('');
  const [type, setType] = useState<TypeSalle>('standard');
  const [capacite, setCapacite] = useState(30);
  const [description, setDescription] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const isEditing = !!editingSalle;

  useEffect(() => {
    if (editingSalle) {
      setNom(editingSalle.nom);
      setType(editingSalle.type);
      setCapacite(editingSalle.capacite);
      setDescription(editingSalle.description);
    } else {
      setNom('');
      setType('standard');
      setCapacite(30);
      setDescription('');
    }
  }, [editingSalle]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!nom.trim()) {
      setError('Le nom de la salle est obligatoire');
      return;
    }

    setSubmitting(true);
    setError('');

    const data = {
      nom: nom.trim(),
      type,
      capacite,
      description: description.trim(),
    };

    if (isEditing && editingSalle) {
      await update(
        editingSalle.id,
        data,
        () => onClose(),
        (err) => {
          setError(err);
          setSubmitting(false);
        }
      );
    } else {
      await create(
        data,
        () => onClose(),
        (err) => {
          setError(err);
          setSubmitting(false);
        }
      );
    }

    setSubmitting(false);
  };

  return (
    <Card style={{ marginBottom: '1.5rem' }}>
      <h3 className="card-title" style={{ marginBottom: '1rem' }}>
        {isEditing ? 'Modifier la salle' : 'Nouvelle salle'}
      </h3>

      {error && (
        <Alert variant="error">
          {error}
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <FormGrid columns={4}>
          <Input
            label="Nom *"
            value={nom}
            onChange={(e) => setNom(e.target.value)}
            placeholder="Ex : Salle 101"
            required
          />

          <Select
            label="Type"
            value={type}
            onChange={(e) => setType(e.target.value as TypeSalle)}
            options={TYPE_OPTIONS}
          />

          <Input
            label="Capacité"
            type="number"
            value={capacite}
            onChange={(e) => setCapacite(Number(e.target.value))}
            min={1}
            max={200}
          />

          <Input
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description optionnelle"
          />
        </FormGrid>

        <FormActions>
          <Button type="button" variant="secondary" onClick={onClose}>
            Annuler
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={submitting || !nom.trim()}
            loading={submitting}
          >
            {isEditing ? 'Enregistrer' : 'Créer'}
          </Button>
        </FormActions>
      </form>
    </Card>
  );
}
