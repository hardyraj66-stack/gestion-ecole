import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, Navigate } from 'react-router-dom';
import { useMatieres } from '../../contexts/MatiereContext';
import { useViewing } from '../../contexts/ViewingContext';
import { readApi } from '../../services/readApi';
import { CoefficientNiveau } from '../../types';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card } from '../../components/shared/Card';
import { Input } from '../../components/shared/Input';
import { Textarea } from '../../components/shared/Textarea';
import { Button } from '../../components/shared/Button';
import { Alert } from '../../components/shared/Alert';
import { ColorPicker } from '../../components/shared/ColorPicker';
import { FormGrid, FormActions } from '../../components/shared/FormGrid';
import { Icon } from '../../components/shared/Icon';
import { MatierePreview } from './MatierePreview';

export function CreateMatiere() {
  const { t } = useTranslation();
  const { isViewingArchive } = useViewing();
  const navigate = useNavigate();
  const { create } = useMatieres();

  const COULEURS = [
    { value: '#2563eb', label: t('matieres.couleurs.bleu') },
    { value: '#7c3aed', label: t('matieres.couleurs.violet') },
    { value: '#db2777', label: t('matieres.couleurs.rose') },
    { value: '#dc2626', label: t('matieres.couleurs.rouge') },
    { value: '#d97706', label: t('matieres.couleurs.orange') },
    { value: '#16a34a', label: t('matieres.couleurs.vert') },
    { value: '#0891b2', label: t('matieres.couleurs.cyan') },
    { value: '#475569', label: t('matieres.couleurs.ardoise') },
  ];

  const [nom, setNom] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [couleur, setCouleur] = useState(COULEURS[0].value);
  const [coefficients, setCoefficients] = useState<CoefficientNiveau[]>([]);
  const [niveaux, setNiveaux] = useState<string[]>([]);

  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    readApi.niveaux().then((res: any) => {
      if (res) {
        const ns: string[] = (res as any[]).map((n: any) => n.niveau);
        setNiveaux(ns);
        setCoefficients(ns.map(n => ({ niveau: n, coefficient: 1 })));
      }
    }).catch(() => {});
  }, []);

  if (isViewingArchive) return <Navigate to="/matieres" replace />;

  const setCoeffForNiveau = (niveau: string, val: number) => {
    setCoefficients(prev => prev.map(c => c.niveau === niveau ? { ...c, coefficient: val } : c));
  };

  const addNiveau = (n: string) => {
    if (coefficients.find(c => c.niveau === n)) return;
    setCoefficients(prev => [...prev, { niveau: n, coefficient: 1 }]);
  };

  const removeNiveau = (n: string) => {
    setCoefficients(prev => prev.filter(c => c.niveau !== n));
  };

  const availableToAdd = niveaux.filter(n => !coefficients.find(c => c.niveau === n));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!nom.trim() || !code.trim()) {
      setError(t('matieres.champsObligatoires'));
      return;
    }
    if (coefficients.length === 0) {
      setError(t('matieres.coefficientVide'));
      return;
    }
    for (const c of coefficients) {
      if (c.coefficient <= 0) {
        setError(t('matieres.coefficientPositif', { niveau: c.niveau }));
        return;
      }
    }

    setSubmitting(true);
    setError('');

    const result = await create({
      nom: nom.trim(),
      code: code.trim().toUpperCase(),
      coefficients,
      description: description.trim() || undefined,
      couleur,
    } as any);

    if (result) {
      setSuccess(true);
      setTimeout(() => navigate('/matieres'), 1500);
    } else {
      setError(t('matieres.erreurCreation'));
      setSubmitting(false);
    }
  };

  return (
    <div>
      <PageHeader title={t('matieres.creerTitre')} subtitle={t('matieres.creerSousTitre')}>
        <Button as="link" to="/matieres" variant="secondary">{t('matieres.retour')}</Button>
      </PageHeader>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '1.5rem', maxWidth: '900px' }}>
        <Card>
          {success && <Alert variant="success">{t('matieres.succes')}</Alert>}
          {error && <Alert variant="error">{error}</Alert>}

          <form onSubmit={handleSubmit}>
            <FormGrid>
              <Input
                label={t('matieres.form.nom')}
                value={nom}
                onChange={e => setNom(e.target.value)}
                placeholder={t('matieres.form.nomPlaceholder')}
                required
              />
              <Input
                label={t('matieres.form.code')}
                value={code}
                onChange={e => setCode(e.target.value.toUpperCase())}
                placeholder={t('matieres.form.codePlaceholder')}
                maxLength={6}
                required
              />
            </FormGrid>

            <Textarea
              label={t('matieres.form.description')}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder={t('matieres.form.descriptionPlaceholder')}
              rows={3}
            />

            <ColorPicker label={t('matieres.form.couleur')} colors={COULEURS} value={couleur} onChange={setCouleur} />

            <div className="matiere-coef-section" style={{ marginTop: '1.25rem' }}>
              <div className="matiere-coef-title">{t('matieres.form.coefficients')}</div>
              {coefficients.length === 0 && (
                <p className="matiere-coef-empty">{t('matieres.form.coefficientsVide')}</p>
              )}
              {coefficients.map(c => (
                <div key={c.niveau} className="matiere-coef-row">
                  <span className="matiere-coef-niveau">{c.niveau}</span>
                  <input
                    type="number"
                    className="matiere-coef-input"
                    value={c.coefficient}
                    min={0.5}
                    max={20}
                    step={0.5}
                    onChange={e => setCoeffForNiveau(c.niveau, parseFloat(e.target.value) || 0)}
                  />
                  <button type="button" className="matiere-coef-remove" onClick={() => removeNiveau(c.niveau)} title={t('matieres.form.retirerNiveau')}>
                    <Icon path="M6 18L18 6M6 6l12 12" size={12} />
                  </button>
                </div>
              ))}
              {availableToAdd.length > 0 && (
                <div className="matiere-coef-add">
                  <select
                    className="matiere-coef-add-select"
                    defaultValue=""
                    onChange={e => { if (e.target.value) { addNiveau(e.target.value); e.target.value = ''; } }}
                  >
                    <option value="" disabled>{t('matieres.form.ajouterNiveau')}</option>
                    {availableToAdd.map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
              )}
            </div>

            <FormActions>
              <Button as="link" to="/matieres" variant="secondary">{t('common.annuler')}</Button>
              <Button type="submit" variant="primary" disabled={submitting || success} loading={submitting}>
                {t('matieres.form.creerBtn')}
              </Button>
            </FormActions>
          </form>
        </Card>

        <MatierePreview
          nom={nom}
          code={code}
          coefficients={coefficients}
          description={description}
          couleur={couleur}
        />
      </div>
    </div>
  );
}
