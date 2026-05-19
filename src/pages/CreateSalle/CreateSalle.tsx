import { useState } from 'react';
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

const TYPE_OPTIONS: SelectOption[] = TYPES_SALLE.map(t => ({ value: t.value, label: t.label }));

export function CreateSalle() {
  const navigate = useNavigate();
  const { create } = useSalles();

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
    if (!nom.trim()) { setError('Le nom est obligatoire'); return; }
    if (capacite < 1) { setError('La capacité doit être supérieure à 0'); return; }

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
      <PageHeader title="Nouvelle salle" subtitle="Créer une salle">
        <Button variant="secondary" onClick={() => navigate('/salles')}>← Retour</Button>
      </PageHeader>

      <div className="create-salle-layout">
        <Card>
          <h3 className="section-title">Informations générales</h3>
          {error && <Alert variant="error">{error}</Alert>}

          <form onSubmit={handleSubmit}>
            <FormGrid columns={2}>
              <Input
                label="Nom *"
                value={nom}
                onChange={e => setNom(e.target.value)}
                placeholder="Ex : Salle A1, Labo de chimie..."
                required
              />
              <Select
                label="Type"
                value={type}
                onChange={e => setType(e.target.value as TypeSalle)}
                options={TYPE_OPTIONS}
              />
              <Input
                label="Capacité maximale *"
                type="number"
                value={capacite}
                onChange={e => setCapacite(Math.max(1, Number(e.target.value)))}
                min={1}
                max={500}
              />
              <Input
                label="Description"
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Description optionnelle"
              />
            </FormGrid>

            <div className="section-divider" />
            <h3 className="section-title">Localisation</h3>
            <FormGrid columns={2}>
              <Input
                label="Bâtiment"
                value={batiment}
                onChange={e => setBatiment(e.target.value)}
                placeholder="Ex : A, B, Principal..."
              />
              <Input
                label="Étage"
                value={etage}
                onChange={e => setEtage(e.target.value)}
                placeholder="Ex : 0, 1, 2, RDC..."
              />
            </FormGrid>

            <div className="section-divider" />
            <h3 className="section-title">Équipements disponibles</h3>
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
            <h3 className="section-title">Accessibilité</h3>
            <label className="pmr-toggle">
              <input
                type="checkbox"
                checked={accessible_pmr}
                onChange={e => setAccessiblePmr(e.target.checked)}
              />
              <span>Accessible PMR (Personnes à Mobilité Réduite)</span>
              {accessible_pmr && <Badge label="PMR" variant="success" />}
            </label>

            <FormActions>
              <Button type="button" variant="secondary" onClick={() => navigate('/salles')}>
                Annuler
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={submitting || !nom.trim()}
                loading={submitting}
              >
                Créer la salle
              </Button>
            </FormActions>
          </form>
        </Card>

        {/* Aperçu */}
        <div className="create-salle-preview">
          <Card>
            <h3 className="section-title">Aperçu</h3>
            <div className="salle-preview-card">
              <div className="salle-preview-nom">{nom || 'Nom de la salle'}</div>
              <div className="salle-preview-meta">
                <span className="salle-type-badge">{TYPES_SALLE.find(t => t.value === type)?.label}</span>
                <span className="salle-capacite">{capacite} places</span>
              </div>
              {description && <p className="salle-preview-desc">{description}</p>}
              {(batiment || etage) && (
                <div className="salle-preview-loc">
                  {batiment && <span>Bât. {batiment}</span>}
                  {etage && <span>Étage {etage}</span>}
                </div>
              )}
              {equipements.length > 0 && (
                <div className="salle-preview-eqs">
                  {equipements.map(eq => (
                    <Badge key={eq} label={eq.replace('_', ' ')} variant="info" />
                  ))}
                </div>
              )}
              {accessible_pmr && <Badge label="Accessible PMR" variant="success" />}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
