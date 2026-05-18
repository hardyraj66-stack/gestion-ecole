import { useState, useEffect } from 'react';
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
      setError('Veuillez remplir tous les champs obligatoires.');
      return;
    }
    if (coefficients.length === 0) {
      setError('Définissez au moins un coefficient de niveau.');
      return;
    }
    for (const c of coefficients) {
      if (c.coefficient <= 0) {
        setError(`Le coefficient pour ${c.niveau} doit être positif.`);
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
      setError('Erreur lors de la création de la matière.');
      setSubmitting(false);
    }
  };

  return (
    <div>
      <PageHeader title="Nouvelle matière" subtitle="Créer une nouvelle matière">
        <Button as="link" to="/matieres" variant="secondary">← Retour</Button>
      </PageHeader>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '1.5rem', maxWidth: '900px' }}>
        <Card>
          {success && <Alert variant="success">Matière créée avec succès ! Redirection en cours…</Alert>}
          {error && <Alert variant="error">{error}</Alert>}

          <form onSubmit={handleSubmit}>
            <FormGrid>
              <Input
                label="Nom de la matière *"
                value={nom}
                onChange={e => setNom(e.target.value)}
                placeholder="Ex : Mathématiques"
                required
              />
              <Input
                label="Code *"
                value={code}
                onChange={e => setCode(e.target.value.toUpperCase())}
                placeholder="Ex : MATH"
                maxLength={6}
                required
              />
            </FormGrid>

            <Textarea
              label="Description"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Description de la matière…"
              rows={3}
            />

            <ColorPicker label="Couleur" colors={COULEURS} value={couleur} onChange={setCouleur} />

            <div className="matiere-coef-section" style={{ marginTop: '1.25rem' }}>
              <div className="matiere-coef-title">Coefficients par niveau *</div>
              {coefficients.length === 0 && (
                <p className="matiere-coef-empty">Ajoutez un niveau pour définir son coefficient.</p>
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
                  <button type="button" className="matiere-coef-remove" onClick={() => removeNiveau(c.niveau)} title="Retirer ce niveau">
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
                    <option value="" disabled>+ Ajouter un niveau</option>
                    {availableToAdd.map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
              )}
            </div>

            <FormActions>
              <Button as="link" to="/matieres" variant="secondary">Annuler</Button>
              <Button type="submit" variant="primary" disabled={submitting || success} loading={submitting}>
                Créer la matière
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
