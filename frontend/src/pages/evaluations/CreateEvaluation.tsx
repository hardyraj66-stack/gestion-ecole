import { useState, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
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

  useEffect(() => {
    if (type !== 'evaluation' || !classeId || !matiereId || !trimestre) {
      setDsManquant(false);
      return;
    }
    readApi.evaluationsList(classeId, matiereId, parseInt(trimestre), 'publie', 1).then((res: any) => {
      const items = res?.items || [];
      const dsPublie = items.some((ev: any) => ev.type === 'ds');
      setDsManquant(!dsPublie);
    });
  }, [type, classeId, matiereId, trimestre]);

  if (isViewingArchive) return <Navigate to="/evaluations" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!classeId || !matiereId || !date) {
      setError(t('evaluations.champsObligatoires'));
      return;
    }
    setSubmitting(true);
    setError('');
    const result = await create({
      type,
      classe_id: classeId,
      matiere_id: matiereId,
      trimestre: parseInt(trimestre) as 1 | 2 | 3,
      anneeScolaireId: anneeActive?.id || '',
      date,
    });
    if (result) {
      navigate(`/evaluations/${result.id}`);
    } else {
      setError(
        type === 'evaluation'
          ? t('evaluations.erreurEvaluation')
          : t('evaluations.erreurDS'),
      );
      setSubmitting(false);
    }
  };

  const classesOptions: SelectOption[] = [
    { value: '', label: t('evaluations.form.classeSelect') },
    ...classes.map((c: any) => ({ value: c.id, label: c.nom })),
  ];
  const matieresOptions: SelectOption[] = [
    { value: '', label: t('evaluations.form.matiereSelect') },
    ...matieres.map((m: any) => ({ value: m.id, label: m.nom })),
  ];
  const trimestreOptions: SelectOption[] = [
    { value: '1', label: t('evaluations.form.trimestreOpt', { t: 1 }) },
    { value: '2', label: t('evaluations.form.trimestreOpt', { t: 2 }) },
    { value: '3', label: t('evaluations.form.trimestreOpt', { t: 3 }) },
  ];

  return (
    <div>
      <PageHeader title={t('evaluations.creerTitre')} subtitle={t('evaluations.creerSousTitre')}>
        <Button as="link" to="/evaluations" variant="secondary">{t('evaluations.retour')}</Button>
      </PageHeader>

      <div style={{ maxWidth: 600 }}>
        <Card>
          {error && <Alert variant="error">{error}</Alert>}
          {dsManquant && (
            <Alert variant="warning">
              {t('evaluations.dsManquantAlert')}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontWeight: type === 'ds' ? 600 : 400 }}>
                <input type="radio" value="ds" checked={type === 'ds'} onChange={() => setType('ds')} />
                {t('evaluations.types.ds')}
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontWeight: type === 'evaluation' ? 600 : 400 }}>
                <input type="radio" value="evaluation" checked={type === 'evaluation'} onChange={() => setType('evaluation')} />
                {t('evaluations.types.evaluation')}
              </label>
            </div>

            <FormGrid>
              <Select
                label={t('evaluations.form.classe')}
                options={classesOptions}
                value={classeId}
                onChange={e => setClasseId(e.target.value)}
                required
              />
              <Select
                label={t('evaluations.form.matiere')}
                options={matieresOptions}
                value={matiereId}
                onChange={e => setMatiereId(e.target.value)}
                required
              />
              <Select
                label={t('evaluations.form.trimestre')}
                options={trimestreOptions}
                value={trimestre}
                onChange={e => setTrimestre(e.target.value as '1' | '2' | '3')}
              />
              <Input
                label={t('evaluations.form.date')}
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                required
              />
            </FormGrid>

            <FormActions>
              <Button as="link" to="/evaluations" variant="secondary">{t('evaluations.annuler')}</Button>
              <Button
                type="submit"
                variant="primary"
                disabled={submitting || (type === 'evaluation' && dsManquant)}
                loading={submitting}
              >
                {t('evaluations.creerBtn')}
              </Button>
            </FormActions>
          </form>
        </Card>
      </div>
    </div>
  );
}
