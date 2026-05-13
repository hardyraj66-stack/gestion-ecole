import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useMatieres } from '../../contexts/MatiereContext';
import { useViewing } from '../../contexts/ViewingContext';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card } from '../../components/shared/Card';
import { Input } from '../../components/shared/Input';
import { Textarea } from '../../components/shared/Textarea';
import { Button } from '../../components/shared/Button';
import { Alert } from '../../components/shared/Alert';
import { ColorPicker } from '../../components/shared/ColorPicker';
import { FormGrid, FormActions } from '../../components/shared/FormGrid';
import { MatierePreview } from './MatierePreview';

const COULEURS = [
  { value: '#2563eb', label: 'Bleu' },
  { value: '#7c3aed', label: 'Violet' },
  { value: '#db2777', label: 'Rose' },
  { value: '#dc2626', label: 'Rouge' },
  { value: '#d97706', label: 'Orange' },
  { value: '#16a34a', label: 'Vert' },
  { value: '#0891b2', label: 'Cyan' },
  { value: '#475569', label: 'Ardoise' },
];

export function CreateMatiere() {
  const { isViewingArchive } = useViewing();
  const navigate = useNavigate();
  const { create } = useMatieres();

  if (isViewingArchive) return <Navigate to="/matieres" replace />;

  const [nom, setNom] = useState('');
  const [code, setCode] = useState('');
  const [coefficient, setCoefficient] = useState(1);
  const [description, setDescription] = useState('');
  const [couleur, setCouleur] = useState(COULEURS[0].value);

  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!nom.trim() || !code.trim()) {
      setError('Veuillez remplir tous les champs obligatoires');
      return;
    }

    setSubmitting(true);
    setError('');

    const result = await create({
      nom: nom.trim(),
      code: code.trim().toUpperCase(),
      coefficient,
      description: description.trim() || undefined,
      couleur,
    });

    if (result) {
      setSuccess(true);
      setTimeout(() => navigate('/matieres'), 1500);
    } else {
      setError('Erreur lors de la création de la matière');
      setSubmitting(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Nouvelle matière"
        subtitle="Créer une nouvelle matière"
      >
        <Button as="link" to="/matieres" variant="secondary">
          ← Retour
        </Button>
      </PageHeader>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '1.5rem', maxWidth: '900px' }}>
        <Card>
          {success && (
            <Alert variant="success">
              Matière créée avec succès ! Redirection en cours…
            </Alert>
          )}

          {error && (
            <Alert variant="error">
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <FormGrid>
              <Input
                label="Nom de la matière *"
                value={nom}
                onChange={(e) => setNom(e.target.value)}
                placeholder="Ex : Mathématiques"
                required
              />

              <Input
                label="Code *"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="Ex : MATH"
                maxLength={6}
                required
              />
            </FormGrid>

            <Input
              label="Coefficient *"
              type="number"
              value={coefficient}
              onChange={(e) => setCoefficient(Number(e.target.value))}
              min={1}
              max={10}
            />

            <Textarea
              label="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description de la matière…"
              rows={3}
            />

            <ColorPicker
              label="Couleur"
              colors={COULEURS}
              value={couleur}
              onChange={setCouleur}
            />

            <FormActions>
              <Button as="link" to="/matieres" variant="secondary">
                Annuler
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={submitting || success}
                loading={submitting}
              >
                Créer la matière
              </Button>
            </FormActions>
          </form>
        </Card>

        <MatierePreview
          nom={nom}
          code={code}
          coefficient={coefficient}
          description={description}
          couleur={couleur}
        />
      </div>
    </div>
  );
}
