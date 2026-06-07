import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useSalles } from '../../contexts/SalleContext';
import { Salle, TypeSalle, TYPES_SALLE, Equipement, EQUIPEMENTS_SALLE } from '../../types';
import { Input } from '../../components/shared/Input';
import { Select, SelectOption } from '../../components/shared/Select';
import { Button } from '../../components/shared/Button';
import { Alert } from '../../components/shared/Alert';
import { FormGrid } from '../../components/shared/FormGrid';
import { Badge } from '../../components/ui/Badge';

interface SalleEditModalProps {
  salle: Salle;
  onClose: () => void;
}

export function SalleEditModal({ salle, onClose }: SalleEditModalProps) {
  const { t } = useTranslation();
  const { update } = useSalles();

  const TYPE_OPTIONS: SelectOption[] = TYPES_SALLE.map(typ => ({ value: typ.value, label: typ.label }));

  const [nom, setNom] = useState(salle.nom);
  const [type, setType] = useState<TypeSalle>(salle.type);
  const [capacite, setCapacite] = useState(salle.capacite);
  const [description, setDescription] = useState(salle.description);
  const [equipements, setEquipements] = useState<Equipement[]>((salle.equipements || []) as Equipement[]);
  const [accessible_pmr, setAccessiblePmr] = useState(salle.accessible_pmr || false);
  const [batiment, setBatiment] = useState(salle.batiment || '');
  const [etage, setEtage] = useState(salle.etage || '');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setNom(salle.nom);
    setType(salle.type);
    setCapacite(salle.capacite);
    setDescription(salle.description);
    setEquipements((salle.equipements || []) as Equipement[]);
    setAccessiblePmr(salle.accessible_pmr || false);
    setBatiment(salle.batiment || '');
    setEtage(salle.etage || '');
  }, [salle]);

  const toggleEquipement = (eq: Equipement) => {
    setEquipements(prev =>
      prev.includes(eq) ? prev.filter(e => e !== eq) : [...prev, eq]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nom.trim()) { setError(t('salles.edit.nomObligatoire')); return; }
    setSubmitting(true);
    setError('');
    await update(
      salle.id,
      { nom: nom.trim(), type, capacite, description: description.trim(), equipements, accessible_pmr, batiment: batiment.trim(), etage: etage.trim() },
      () => onClose(),
      (err) => { setError(err); setSubmitting(false); },
    );
    setSubmitting(false);
  };

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-panel modal-lg">
        <div className="modal-header">
          <h2 className="modal-title">{t('salles.edit.titre', { nom: salle.nom })}</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          {error && <Alert variant="error">{error}</Alert>}
          <form onSubmit={handleSubmit} id="salle-edit-form">
            <h4 className="section-label">{t('salles.edit.infoGenerales')}</h4>
            <FormGrid columns={2}>
              <Input label={t('salles.edit.form.nom')} value={nom} onChange={e => setNom(e.target.value)} required />
              <Select label={t('salles.edit.form.type')} value={type} onChange={e => setType(e.target.value as TypeSalle)} options={TYPE_OPTIONS} />
              <Input
                label={t('salles.edit.form.capacite')}
                type="number"
                value={capacite}
                onChange={e => setCapacite(Math.max(1, Number(e.target.value)))}
                min={1} max={500}
              />
              <Input
                label={t('salles.edit.form.description')}
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder={t('salles.edit.form.descriptionPlaceholder')}
              />
            </FormGrid>

            <h4 className="section-label">{t('salles.edit.localisation')}</h4>
            <FormGrid columns={2}>
              <Input label={t('salles.edit.form.batiment')} value={batiment} onChange={e => setBatiment(e.target.value)} placeholder={t('salles.edit.form.batimentPlaceholder')} />
              <Input label={t('salles.edit.form.etage')} value={etage} onChange={e => setEtage(e.target.value)} placeholder={t('salles.edit.form.etagePlaceholder')} />
            </FormGrid>

            <h4 className="section-label">{t('salles.edit.equipements')}</h4>
            <div className="equipements-grid">
              {EQUIPEMENTS_SALLE.map(eq => (
                <label key={eq.value} className={`equipement-checkbox${equipements.includes(eq.value) ? ' selected' : ''}`}>
                  <input type="checkbox" checked={equipements.includes(eq.value)} onChange={() => toggleEquipement(eq.value)} />
                  <span>{eq.label}</span>
                </label>
              ))}
            </div>

            <h4 className="section-label">{t('salles.edit.accessibilite')}</h4>
            <label className="pmr-toggle">
              <input type="checkbox" checked={accessible_pmr} onChange={e => setAccessiblePmr(e.target.checked)} />
              <span>{t('salles.edit.form.pmr')}</span>
              {accessible_pmr && <Badge label="PMR" variant="success" />}
            </label>
          </form>
        </div>
        <div className="modal-footer">
          <Button variant="secondary" onClick={onClose}>{t('common.annuler')}</Button>
          <Button
            type="submit"
            form="salle-edit-form"
            variant="primary"
            disabled={submitting || !nom.trim()}
            loading={submitting}
          >
            {t('common.enregistrer')}
          </Button>
        </div>
      </div>
    </div>
  );
}
