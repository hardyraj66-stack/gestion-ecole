import { useState, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useViewing } from '../../contexts/ViewingContext';
import { useEvaluations } from '../../contexts/EvaluationContext';
import { useAnnees } from '../../contexts/AnneeContext';
import { readApi } from '../../services/readApi';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card } from '../../components/shared/Card';
import { Input } from '../../components/shared/Input';
import { Button } from '../../components/shared/Button';
import { Alert } from '../../components/shared/Alert';
import { Select, SelectOption } from '../../components/shared/Select';
import { FormGrid, FormActions } from '../../components/shared/FormGrid';

export function CreateEvaluation() {
  const navigate = useNavigate();
  const { isViewingArchive } = useViewing();
  const { create } = useEvaluations();
  const { active: anneeActive } = useAnnees();

  const [type, setType] = useState<'ds' | 'evaluation'>('ds');
  const [classeId, setClasseId] = useState('');
  const [matiereId, setMatiereId] = useState('');
  const [trimestre, setTrimestre] = useState<'1' | '2' | '3'>('1');
  const [date, setDate] = useState('');
  const [classes, setClasses] = useState<any[]>([]);
  const [matieres, setMatieres] = useState<any[]>([]);
  const [dsManquant, setDsManquant] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      readApi.classesList(1, 100),
      readApi.matieresList(1, 100),
    ]).then(([c, m]) => {
      if (c) setClasses((c as any).items || []);
      if (m) setMatieres((m as any).items || []);
    });
  }, []);

  // Vérifie côté frontend si DS publié existe pour le triplet (information uniquement — la validation réelle est backend)
  useEffect(() => {
    if (type !== 'evaluation' || !classeId || !matiereId || !trimestre) {
      setDsManquant(false);
      return;
    }
    readApi.evaluationsList(classeId, matiereId, parseInt(trimestre), 'publie', 1, 1).then((res: any) => {
      const items = res?.items || [];
      const dsPublie = items.some((ev: any) => ev.type === 'ds');
      setDsManquant(!dsPublie);
    });
  }, [type, classeId, matiereId, trimestre]);

  if (isViewingArchive) return <Navigate to="/evaluations" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!classeId || !matiereId || !date) {
      setError('Veuillez remplir tous les champs obligatoires.');
      return;
    }
    setSubmitting(true);
    setError('');
    const result = await create({
      type,
      classe_id: classeId,
      matiere_id: matiereId,
      trimestre: parseInt(trimestre) as 1 | 2 | 3,
      annee_scolaire: anneeActive?.label || '',
      date,
    });
    if (result) {
      navigate(`/evaluations/${result.id}`);
    } else {
      setError(
        type === 'evaluation'
          ? 'Erreur : vérifiez que le DS est bien publié pour cette classe, matière et trimestre.'
          : 'Erreur lors de la création. Un DS existe peut-être déjà pour ce triplet.',
      );
      setSubmitting(false);
    }
  };

  const classesOptions: SelectOption[] = [
    { value: '', label: 'Sélectionner une classe' },
    ...classes.map((c: any) => ({ value: c.id, label: c.nom })),
  ];
  const matieresOptions: SelectOption[] = [
    { value: '', label: 'Sélectionner une matière' },
    ...matieres.map((m: any) => ({ value: m.id, label: m.nom })),
  ];
  const trimestreOptions: SelectOption[] = [
    { value: '1', label: 'Trimestre 1' },
    { value: '2', label: 'Trimestre 2' },
    { value: '3', label: 'Trimestre 3' },
  ];

  return (
    <div>
      <PageHeader title="Nouvelle évaluation" subtitle="Créer un DS ou une évaluation">
        <Button as="link" to="/evaluations" variant="secondary">← Retour</Button>
      </PageHeader>

      <div style={{ maxWidth: 600 }}>
        <Card>
          {error && <Alert variant="error">{error}</Alert>}
          {dsManquant && (
            <Alert variant="warning">
              Aucun DS publié pour cette classe, matière et trimestre. Créez et publiez le DS avant de créer l'évaluation.
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontWeight: type === 'ds' ? 600 : 400 }}>
                <input type="radio" value="ds" checked={type === 'ds'} onChange={() => setType('ds')} />
                DS
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontWeight: type === 'evaluation' ? 600 : 400 }}>
                <input type="radio" value="evaluation" checked={type === 'evaluation'} onChange={() => setType('evaluation')} />
                Évaluation
              </label>
            </div>

            <FormGrid>
              <Select
                label="Classe *"
                options={classesOptions}
                value={classeId}
                onChange={e => setClasseId(e.target.value)}
                required
              />
              <Select
                label="Matière *"
                options={matieresOptions}
                value={matiereId}
                onChange={e => setMatiereId(e.target.value)}
                required
              />
              <Select
                label="Trimestre *"
                options={trimestreOptions}
                value={trimestre}
                onChange={e => setTrimestre(e.target.value as '1' | '2' | '3')}
              />
              <Input
                label="Date *"
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                required
              />
            </FormGrid>

            <FormActions>
              <Button as="link" to="/evaluations" variant="secondary">Annuler</Button>
              <Button
                type="submit"
                variant="primary"
                disabled={submitting || (type === 'evaluation' && dsManquant)}
                loading={submitting}
              >
                Créer
              </Button>
            </FormActions>
          </form>
        </Card>
      </div>
    </div>
  );
}
