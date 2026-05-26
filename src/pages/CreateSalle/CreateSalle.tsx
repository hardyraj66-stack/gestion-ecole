import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useSalles } from '../../contexts/SalleContext';
import { TypeSalle, TYPES_SALLE, Equipement, EQUIPEMENTS_SALLE } from '../../types';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card } from '../../components/shared/Card';
import { Input } from '../../components/shared/Input';
import { Select, SelectOption } from '../../components/shared/Select';
import { Button } from '../../components/shared/Button';
import { Alert } from '../../components/shared/Alert';
import { FormGrid, FormActions } from '../../components/shared/FormGrid';
import { Badge } from '../../components/ui/Badge';

export function CreateSalle() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { create } = useSalles();

  const TYPE_OPTIONS: SelectOption[] = TYPES_SALLE.map(typ => ({ value: typ.value, label: typ.label }));

  const [nom, setNom] = useState('');
  const [type, setType] = useState<TypeSalle>('standard');
  const [capacite, setCapacite] = useState(30);
  const [description, setDescription] = useState('');
  const [equipements, setEquipements] = useState<Equipement[]>([]);
  const [accessible_pmr, setAccessiblePmr] = useState(false);
  const [batiment, setBatiment] = useState('');
  const [etage, setEtage] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const toggleEquipement = (eq: Equipement) => {
    setEquipements(prev =>
      prev.includes(eq) ? prev.filter(e => e !== eq) : [...prev, eq]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nom.trim()) { setError(t('salles.creer.erreurs.nomObligatoire')); return; }
    if (capacite < 1) { setError(t('salles.creer.erreurs.capaciteInvalide')); return; }

    setSubmitting(true);
    setError('');

    await create(
      { nom: nom.trim(), type, capacite, description: description.trim(), equipements, accessible_pmr, batiment: batiment.trim(), etage: etage.trim() },
      () => navigate('/salles'),
      (err) => { setError(err); setSubmitting(false); },
    );
    setSubmitting(false);
  };

  return (
    <div>
      <PageHeader title={t('salles.creer.titre')} subtitle={t('salles.creer.sousTitre')}>
        <Button variant="secondary" onClick={() => navigate('/salles')}>{t('salles.retour')}</Button>
      </PageHeader>

      <div className="create-salle-layout">
        <Card>
          <h3 className="section-title">{t('salles.creer.sections.general')}</h3>
          {error && <Alert variant="error">{error}</Alert>}

          <form onSubmit={handleSubmit}>
            <FormGrid columns={2}>
              <Input
                label={t('salles.creer.form.nom')}
                value={nom}
                onChange={e => setNom(e.target.value)}
                placeholder={t('salles.creer.form.nomPlaceholder')}
                required
              />
              <Select
                label={t('salles.creer.form.type')}
                value={type}
                onChange={e => setType(e.target.value as TypeSalle)}
                options={TYPE_OPTIONS}
              />
              <Input
                label={t('salles.creer.form.capacite')}
                type="number"
                value={capacite}
                onChange={e => setCapacite(Math.max(1, Number(e.target.value)))}
                min={1}
                max={500}
              />
              <Input
                label={t('salles.creer.form.description')}
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder={t('salles.creer.form.descriptionPlaceholder')}
              />
            </FormGrid>

            <div className="section-divider" />
            <h3 className="section-title">{t('salles.creer.sections.localisation')}</h3>
            <FormGrid columns={2}>
              <Input
                label={t('salles.creer.form.batiment')}
                value={batiment}
                onChange={e => setBatiment(e.target.value)}
                placeholder={t('salles.creer.form.batimentPlaceholder')}
              />
              <Input
                label={t('salles.creer.form.etage')}
                value={etage}
                onChange={e => setEtage(e.target.value)}
                placeholder={t('salles.creer.form.etagePlaceholder')}
              />
            </FormGrid>

            <div className="section-divider" />
            <h3 className="section-title">{t('salles.creer.sections.equipements')}</h3>
            <div className="equipements-grid">
              {EQUIPEMENTS_SALLE.map(eq => (
                <label key={eq.value} className={`equipement-checkbox${equipements.includes(eq.value) ? ' selected' : ''}`}>
                  <input
                    type="checkbox"
                    checked={equipements.includes(eq.value)}
                    onChange={() => toggleEquipement(eq.value)}
                  />
                  <span>{eq.label}</span>
                </label>
              ))}
            </div>

            <div className="section-divider" />
            <h3 className="section-title">{t('salles.creer.sections.accessibilite')}</h3>
            <label className="pmr-toggle">
              <input
                type="checkbox"
                checked={accessible_pmr}
                onChange={e => setAccessiblePmr(e.target.checked)}
              />
              <span>{t('salles.creer.form.pmr')}</span>
              {accessible_pmr && <Badge label={t('salles.creer.form.pmrLabel')} variant="success" />}
            </label>

            <FormActions>
              <Button type="button" variant="secondary" onClick={() => navigate('/salles')}>
                {t('common.annuler')}
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={submitting || !nom.trim()}
                loading={submitting}
              >
                {t('salles.creer.creerBtn')}
              </Button>
            </FormActions>
          </form>
        </Card>

        <div className="create-salle-preview">
          <Card>
            <h3 className="section-title">{t('salles.creer.apercu.titre')}</h3>
            <div className="salle-preview-card">
              <div className="salle-preview-nom">{nom || t('salles.creer.apercu.nomSalle')}</div>
              <div className="salle-preview-meta">
                <span className="salle-type-badge">{TYPES_SALLE.find(typ => typ.value === type)?.label}</span>
                <span className="salle-capacite">{capacite} {t('salles.creer.apercu.places')}</span>
              </div>
              {description && <p className="salle-preview-desc">{description}</p>}
              {(batiment || etage) && (
                <div className="salle-preview-loc">
                  {batiment && <span>{t('salles.creer.apercu.bat')} {batiment}</span>}
                  {etage && <span>{t('salles.creer.apercu.etage')} {etage}</span>}
                </div>
              )}
              {equipements.length > 0 && (
                <div className="salle-preview-eqs">
                  {equipements.map(eq => (
                    <Badge key={eq} label={eq.replace('_', ' ')} variant="info" />
                  ))}
                </div>
              )}
              {accessible_pmr && <Badge label={t('salles.creer.apercu.pmr')} variant="success" />}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
