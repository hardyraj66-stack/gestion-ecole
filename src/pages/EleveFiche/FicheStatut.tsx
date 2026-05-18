import { useState } from 'react';
import { EleveStatut } from '../../types';
import { API_BASE_URL } from '../../config/api';
import { Card, CardHeader } from '../../components/shared/Card';
import { Icon } from '../../components/shared/Icon';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/shared/Button';
import { Input } from '../../components/shared/Input';
import { Select, SelectOption } from '../../components/shared/Select';
import { Textarea } from '../../components/shared/Textarea';
import { useConfirm } from '../../components/shared/ConfirmDialog';

const MOTIF_DEPART_OPTIONS: SelectOption[] = [
  { value: 'changement_ecole', label: 'Changement d\'école' },
  { value: 'demenagement', label: 'Déménagement' },
  { value: 'raison_familiale', label: 'Raison familiale' },
  { value: 'autre', label: 'Autre' },
];

interface Props {
  eleveId: string;
  nomComplet: string;
  statut: EleveStatut;
  anneeActive: string | null;
  nbAvertissements: number;
  readOnly: boolean;
  onStatutChange: (statut: EleveStatut) => void;
}

export function FicheStatut({ eleveId, nomComplet, statut, anneeActive, nbAvertissements, readOnly, onStatutChange }: Props) {
  const confirm = useConfirm();
  const [mode, setMode] = useState<'idle' | 'exclure' | 'depart'>('idle');
  const [submitting, setSubmitting] = useState(false);

  const [excluForm, setExcluForm] = useState({ raison: '', commentaire: '' });
  const [departForm, setDepartForm] = useState({ raison: '', motif: 'changement_ecole', commentaire: '' });

  const handleExclure = async () => {
    if (!excluForm.raison.trim()) return;
    const ok = await confirm({
      title: 'Confirmer l\'exclusion',
      message: `Vous allez exclure définitivement « ${nomComplet} » de l'établissement. Cette action est irréversible sans intervention manuelle. Continuer ?`,
      confirmText: 'Exclure l\'élève',
      variant: 'danger',
    });
    if (!ok) return;
    setSubmitting(true);
    const res = await fetch(`${API_BASE_URL}/exclusions/eleve/${eleveId}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...excluForm, annee_scolaire: anneeActive || '', nb_avertissements: nbAvertissements }),
    });
    if (res.ok) { onStatutChange('exclu'); setMode('idle'); }
    setSubmitting(false);
  };

  const handleDepart = async () => {
    if (!departForm.raison.trim()) return;
    const ok = await confirm({
      title: 'Confirmer le départ',
      message: `Vous allez marquer « ${nomComplet} » comme ayant quitté l'établissement. Continuer ?`,
      confirmText: 'Confirmer le départ',
      variant: 'danger',
    });
    if (!ok) return;
    setSubmitting(true);
    const res = await fetch(`${API_BASE_URL}/departs/eleve/${eleveId}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...departForm, annee_scolaire: anneeActive || '' }),
    });
    if (res.ok) { onStatutChange('parti'); setMode('idle'); }
    setSubmitting(false);
  };

  const handleAnnulerExclusion = async () => {
    const ok = await confirm({ title: 'Annuler l\'exclusion', message: `Réintégrer « ${nomComplet } » comme élève actif ?`, confirmText: 'Réintégrer', variant: 'danger' });
    if (!ok) return;
    await fetch(`${API_BASE_URL}/exclusions/eleve/${eleveId}`, { method: 'DELETE' });
    onStatutChange('actif');
  };

  const handleAnnulerDepart = async () => {
    const ok = await confirm({ title: 'Annuler le départ', message: `Réintégrer « ${nomComplet} » comme élève actif ?`, confirmText: 'Réintégrer', variant: 'danger' });
    if (!ok) return;
    await fetch(`${API_BASE_URL}/departs/eleve/${eleveId}`, { method: 'DELETE' });
    onStatutChange('actif');
  };

  const statutBadge = statut === 'exclu'
    ? <Badge label="Exclu (disciplinaire)" variant="danger" />
    : statut === 'parti'
    ? <Badge label="A quitté l'établissement" variant="warning" />
    : <Badge label="Actif" variant="success" />;

  return (
    <Card>
      <CardHeader title="Statut de l'élève" />

      <div className="statut-current">
        <div className="statut-current-label">Statut actuel</div>
        <div className="statut-current-value">{statutBadge}</div>
      </div>

      {/* Élève actif — affiche les actions */}
      {statut === 'actif' && !readOnly && mode === 'idle' && (
        <div className="statut-actions">
          <button className="statut-action-btn statut-action-btn-danger" onClick={() => setMode('exclure')}>
            <Icon path="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" size={16} />
            <div>
              <div className="statut-action-title">Exclure l'élève</div>
              <div className="statut-action-sub">Exclusion disciplinaire décidée par l'établissement</div>
            </div>
          </button>
          <button className="statut-action-btn statut-action-btn-warning" onClick={() => setMode('depart')}>
            <Icon path="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" size={16} />
            <div>
              <div className="statut-action-title">Marquer comme parti</div>
              <div className="statut-action-sub">Départ volontaire ou administratif</div>
            </div>
          </button>
        </div>
      )}

      {/* Formulaire exclusion */}
      {mode === 'exclure' && (
        <div className="suivi-form statut-form">
          <div className="statut-form-warning">
            <Icon path="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" size={16} />
            Exclusion disciplinaire — une raison spécifique est obligatoire, indépendante des avertissements.
          </div>
          <Input label="Raison de l'exclusion *" value={excluForm.raison} onChange={e => setExcluForm(f => ({ ...f, raison: e.target.value }))} placeholder="Motif précis de l'exclusion" fullWidth />
          <Textarea label="Commentaire" value={excluForm.commentaire} onChange={e => setExcluForm(f => ({ ...f, commentaire: e.target.value }))} placeholder="Circonstances, décisions prises…" />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
            <Button size="sm" variant="secondary" onClick={() => setMode('idle')}>Annuler</Button>
            <Button size="sm" variant="danger" onClick={handleExclure} disabled={submitting || !excluForm.raison.trim()} loading={submitting}>Confirmer l'exclusion</Button>
          </div>
        </div>
      )}

      {/* Formulaire départ */}
      {mode === 'depart' && (
        <div className="suivi-form statut-form">
          <Select label="Motif du départ *" value={departForm.motif} onChange={e => setDepartForm(f => ({ ...f, motif: e.target.value }))} options={MOTIF_DEPART_OPTIONS} />
          <Input label="Raison *" value={departForm.raison} onChange={e => setDepartForm(f => ({ ...f, raison: e.target.value }))} placeholder="Expliquer les circonstances du départ" fullWidth />
          <Textarea label="Commentaire" value={departForm.commentaire} onChange={e => setDepartForm(f => ({ ...f, commentaire: e.target.value }))} placeholder="Informations complémentaires…" />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
            <Button size="sm" variant="secondary" onClick={() => setMode('idle')}>Annuler</Button>
            <Button size="sm" variant="danger" onClick={handleDepart} disabled={submitting || !departForm.raison.trim()} loading={submitting}>Confirmer le départ</Button>
          </div>
        </div>
      )}

      {/* Élève exclu */}
      {statut === 'exclu' && (
        <div className="statut-info statut-info-danger">
          <Icon path="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" size={16} />
          <div>
            <div className="statut-info-title">Élève exclu disciplinairement</div>
            <div className="statut-info-sub">Cet élève n'est plus actif dans l'établissement suite à une décision disciplinaire.</div>
          </div>
          {!readOnly && (
            <button className="statut-annuler-btn" onClick={handleAnnulerExclusion}>Réintégrer</button>
          )}
        </div>
      )}

      {/* Élève parti */}
      {statut === 'parti' && (
        <div className="statut-info statut-info-warning">
          <Icon path="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" size={16} />
          <div>
            <div className="statut-info-title">Élève ayant quitté l'établissement</div>
            <div className="statut-info-sub">Départ volontaire ou administratif — non lié à une sanction disciplinaire.</div>
          </div>
          {!readOnly && (
            <button className="statut-annuler-btn" onClick={handleAnnulerDepart}>Réintégrer</button>
          )}
        </div>
      )}
    </Card>
  );
}
