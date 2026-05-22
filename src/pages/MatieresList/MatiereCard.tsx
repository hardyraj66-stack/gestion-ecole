import { useState } from 'react';
import { Matiere, CoefficientNiveau } from '../../types';
import { Card } from '../../components/shared/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/shared/Button';
import { Input } from '../../components/shared/Input';
import { Textarea } from '../../components/shared/Textarea';
import { Icon } from '../../components/shared/Icon';
import { useConfirm } from '../../components/shared/ConfirmDialog';
import { API_BASE_URL } from '../../config/api';

interface MatiereCardProps {
  matiere: Matiere;
  niveaux: string[];
  onDelete: (id: string) => void;
  onUpdated: (m: Matiere) => void;
  readOnly?: boolean;
}

export function MatiereCard({ matiere, niveaux, onDelete, onUpdated, readOnly }: MatiereCardProps) {
  const confirm = useConfirm();
  const couleur = matiere.couleur || '#2563eb';

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [nom, setNom] = useState(matiere.nom);
  const [description, setDescription] = useState(matiere.description || '');
  const [coefficients, setCoefficients] = useState<CoefficientNiveau[]>(
    matiere.coefficients && matiere.coefficients.length > 0
      ? matiere.coefficients
      : niveaux.map(n => ({ niveau: n, coefficient: matiere.coefficient ?? 1 }))
  );

  const startEdit = () => {
    setNom(matiere.nom);
    setDescription(matiere.description || '');
    setCoefficients(
      matiere.coefficients && matiere.coefficients.length > 0
        ? [...matiere.coefficients]
        : niveaux.map(n => ({ niveau: n, coefficient: matiere.coefficient ?? 1 }))
    );
    setError('');
    setEditing(true);
  };

  const cancelEdit = () => { setEditing(false); setError(''); };

  const handleSave = async () => {
    if (!nom.trim()) { setError('Le nom est obligatoire.'); return; }
    for (const c of coefficients) {
      if (c.coefficient <= 0) { setError(`Coefficient invalide pour ${c.niveau}.`); return; }
    }
    setSaving(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE_URL}/matieres/${matiere.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nom: nom.trim(), description: description.trim() || undefined, coefficients }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.message || 'Erreur lors de la sauvegarde.');
      } else {
        const updated = await res.json();
        onUpdated(updated);
        setEditing(false);
      }
    } catch {
      setError('Erreur réseau.');
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    const ok = await confirm({
      title: 'Désactiver la matière',
      message: `Désactiver « ${matiere.nom} » ? Elle ne sera plus proposée dans les nouveaux créneaux, mais les bulletins existants sont conservés.`,
      confirmText: 'Désactiver',
      variant: 'danger',
    });
    if (!ok) return;
    const res = await fetch(`${API_BASE_URL}/matieres/${matiere.id}/desactiver`, { method: 'PATCH' });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      await confirm({
        title: 'Désactivation impossible',
        message: body.message || 'Cette matière ne peut pas être désactivée.',
        confirmText: 'Fermer',
        variant: 'danger',
      });
    } else {
      onDelete(matiere.id);
    }
  };

  const setCoeffForNiveau = (niveau: string, val: number) => {
    setCoefficients(prev => prev.map(c => c.niveau === niveau ? { ...c, coefficient: val } : c));
  };

  const addNiveau = (niveau: string) => {
    if (coefficients.find(c => c.niveau === niveau)) return;
    setCoefficients(prev => [...prev, { niveau, coefficient: 1 }]);
  };

  const removeNiveau = (niveau: string) => {
    setCoefficients(prev => prev.filter(c => c.niveau !== niveau));
  };

  const availableToAdd = niveaux.filter(n => !coefficients.find(c => c.niveau === n));

  if (editing) {
    return (
      <Card borderTop={couleur}>
        <div className="matiere-edit-header">
          <div className="matiere-code" style={{ backgroundColor: `${couleur}20`, color: couleur }}>{matiere.code}</div>
          <span className="matiere-edit-label">Édition</span>
        </div>

        <Input label="Nom *" value={nom} onChange={e => setNom(e.target.value)} fullWidth />
        <Textarea label="Description" value={description} onChange={e => setDescription(e.target.value)} rows={2} />

        <div className="matiere-coef-section">
          <div className="matiere-coef-title">Coefficients par niveau</div>
          {coefficients.length === 0 && (
            <p className="matiere-coef-empty">Aucun niveau configuré. Ajoutez un niveau ci-dessous.</p>
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
              <button className="matiere-coef-remove" onClick={() => removeNiveau(c.niveau)} title="Retirer ce niveau">
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

        {error && <p className="matiere-edit-error">{error}</p>}

        <div className="matiere-edit-actions">
          <Button size="sm" variant="secondary" onClick={cancelEdit} disabled={saving}>Annuler</Button>
          <Button size="sm" variant="primary" onClick={handleSave} loading={saving} disabled={saving}>Enregistrer</Button>
        </div>
      </Card>
    );
  }

  return (
    <Card borderTop={couleur}>
      <div className="matiere-card-header">
        <div className="matiere-code" style={{ backgroundColor: `${couleur}20`, color: couleur }}>{matiere.code}</div>
        {!readOnly && (
          <button className="matiere-edit-btn" onClick={startEdit} title="Modifier">
            <Icon path="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" size={14} />
          </button>
        )}
      </div>

      <h3 className="matiere-card-title">{matiere.nom}</h3>

      {matiere.description && (
        <p className="matiere-card-desc">{matiere.description}</p>
      )}

      {matiere.coefficients && matiere.coefficients.length > 0 ? (
        <div className="matiere-coef-display">
          {matiere.coefficients.map(c => (
            <div key={c.niveau} className="matiere-coef-badge">
              <span className="matiere-coef-badge-niveau">{c.niveau}</span>
              <Badge label={`×${c.coefficient}`} variant="default" />
            </div>
          ))}
        </div>
      ) : matiere.coefficient != null ? (
        <div className="matiere-card-header" style={{ marginTop: '0.5rem' }}>
          <Badge label={`Coef. ${matiere.coefficient}`} variant="default" />
        </div>
      ) : null}

      {!readOnly && (
        <div className="matiere-card-actions">
          <Button variant="danger" size="sm" onClick={handleDelete}>
            Supprimer
          </Button>
        </div>
      )}
    </Card>
  );
}
