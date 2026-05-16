import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { useClasses } from '../../contexts/ClasseContext';
import { useSalles } from '../../contexts/SalleContext';
import { useViewing } from '../../contexts/ViewingContext';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card } from '../../components/shared/Card';
import { Input } from '../../components/shared/Input';
import { Select, SelectOption } from '../../components/shared/Select';
import { Button } from '../../components/shared/Button';
import { Alert } from '../../components/shared/Alert';
import { FormGrid, FormActions } from '../../components/shared/FormGrid';
import { SalleType } from '../../types';
import { generateSchoolYears, getTypeLabel } from '../../utils/helpers';

const NIVEAUX: SelectOption[] = [
  { value: '6ème', label: '6ème' },
  { value: '5ème', label: '5ème' },
  { value: '4ème', label: '4ème' },
  { value: '3ème', label: '3ème' },
  { value: '2nde', label: '2nde' },
  { value: '1ère', label: '1ère' },
  { value: 'Terminale', label: 'Terminale' },
  { value: 'CP', label: 'CP' },
  { value: 'CE1', label: 'CE1' },
  { value: 'CE2', label: 'CE2' },
  { value: 'CM1', label: 'CM1' },
  { value: 'CM2', label: 'CM2' },
];

const SALLE_TYPES: SelectOption[] = [
  { value: 'fixe', label: 'Salle fixe (toujours la même)' },
  { value: 'variable', label: 'Salle variable (selon l\'emploi du temps)' },
];

export function CreateClasse() {
  const navigate = useNavigate();
  const { isViewingArchive } = useViewing();
  const { create } = useClasses();
  const { salles, loading: sallesLoading, getAll: fetchSalles } = useSalles();

  const [nom, setNom] = useState('');
  const [niveau, setNiveau] = useState(NIVEAUX[0].value as string);
  const [anneeScolaire, setAnneeScolaire] = useState(generateSchoolYears()[0]);
  const [capacite, setCapacite] = useState(30);
  const [salleType, setSalleType] = useState<SalleType>('fixe');
  const [salleId, setSalleId] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const schoolYearOptions: SelectOption[] = generateSchoolYears().map(y => ({ value: y, label: y }));

  const salleOptions: SelectOption[] = salles.map(s => ({
    value: s.id,
    label: `${s.nom} — ${s.capacite} places (${getTypeLabel(s.type)})`,
  }));

  const fetchedRef = useRef(false);
  useEffect(() => { if (fetchedRef.current) return; fetchedRef.current = true; fetchSalles(); }, [fetchSalles]);

  useEffect(() => {
    if (salles.length > 0 && !salleId) {
      setSalleId(salles[0].id);
    }
  }, [salles, salleId]);

  // Guard archive — APRÈS tous les hooks
  if (isViewingArchive) return <Navigate to="/classes" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!nom.trim() || !salleId) {
      setError('Veuillez remplir tous les champs obligatoires');
      return;
    }

    const selectedSalle = salles.find(s => s.id === salleId);
    if (!selectedSalle) {
      setError('Veuillez sélectionner une salle valide');
      return;
    }

    setSubmitting(true);
    setError('');

    await create(
      {
        nom: nom.trim(),
        niveau,
        annee_scolaire: anneeScolaire,
        capacite,
        salle: selectedSalle.nom,
        salle_type: salleType,
      },
      () => {
        setSuccess(true);
        setTimeout(() => navigate('/classes'), 1500);
      },
      (err) => {
        setError(err);
        setSubmitting(false);
      }
    );
  };

  const salleLabel = salleType === 'fixe' ? 'Salle assignée *' : 'Salle par défaut *';

  return (
    <div>
      <PageHeader
        title="Nouvelle classe"
        subtitle="Créer une nouvelle classe"
      >
        <Button as="link" to="/classes" variant="secondary">
          ← Retour
        </Button>
      </PageHeader>

      <Card className="" style={{ maxWidth: '600px' }}>
        {success && (
          <Alert variant="success">
            Classe créée avec succès ! Redirection en cours…
          </Alert>
        )}

        {error && (
          <Alert variant="error">
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <Input
            label="Nom de la classe *"
            value={nom}
            onChange={(e) => setNom(e.target.value)}
            placeholder="Ex : 6ème A"
            required
          />

          <FormGrid>
            <Select
              label="Niveau *"
              value={niveau}
              onChange={(e) => setNiveau(e.target.value)}
              options={NIVEAUX}
            />

            <Select
              label="Année scolaire *"
              value={anneeScolaire}
              onChange={(e) => setAnneeScolaire(e.target.value)}
              options={schoolYearOptions}
            />
          </FormGrid>

          <Input
            label="Capacité maximale *"
            type="number"
            value={capacite}
            onChange={(e) => setCapacite(Number(e.target.value))}
            min={10}
            max={50}
          />

          <Select
            label="Mode de salle *"
            value={salleType}
            onChange={(e) => setSalleType(e.target.value as SalleType)}
            options={SALLE_TYPES}
          />

          {sallesLoading ? (
            <Select
              label={salleLabel}
              value=""
              options={[]}
              placeholder="Chargement des salles…"
              disabled
              hint="Récupération en cours…"
            />
          ) : salles.length === 0 ? (
            <div className="form-group">
              <label className="form-label">{salleLabel}</label>
              <select disabled className={error && !salleId ? 'input-error' : ''}>
                <option>Aucune salle disponible</option>
              </select>
              <p className="form-hint">
                Aucune salle n'est enregistrée.{' '}
                <Link to="/salles" style={{ color: 'var(--primary)' }}>
                  Créer une salle
                </Link>
              </p>
            </div>
          ) : (
            <Select
              label={salleLabel}
              value={salleId}
              onChange={(e) => setSalleId(e.target.value)}
              options={salleOptions}
              error={error && !salleId ? 'Sélectionnez une salle' : undefined}
            />
          )}

          <FormActions>
            <Button as="link" to="/classes" variant="secondary">
              Annuler
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={submitting || success || salles.length === 0}
              loading={submitting}
            >
              Créer la classe
            </Button>
          </FormActions>
        </form>
      </Card>
    </div>
  );
}
