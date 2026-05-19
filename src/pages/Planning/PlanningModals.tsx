import { useState } from 'react';
import { Alert } from '../../components/shared/Alert';
import { Input } from '../../components/shared/Input';
import { Select, SelectOption } from '../../components/shared/Select';
import { Button } from '../../components/shared/Button';
import { FormGrid, FormActions } from '../../components/shared/FormGrid';
import { JourSemaine } from '../../types';
import { HEURES, nextSlot } from './planning.helpers';
import { SalleSelect } from './SalleSelect';
import { SalleOccupant } from './planning.types';

const JOUR_OPTIONS: SelectOption[] = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'].map(j => ({ value: j, label: j }));
const HEURE_OPTIONS: SelectOption[] = HEURES.map(h => ({ value: h, label: h }));

// ─── Create modal ─────────────────────────────────────────────────────────────
interface CreateModalProps {
  show: boolean;
  formJour: JourSemaine; formDebut: string; formFin: string;
  formMatiereId: string; formSalle: string; formEnseignant: string;
  formSubmitting: boolean; formError: string;
  matiereOptions: SelectOption[];
  salleFixe?: string;
  initialConflict: SalleOccupant | null;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  setFormJour: (v: JourSemaine) => void;
  setFormDebut: (v: string) => void;
  setFormFin: (v: string) => void;
  setFormMatiereId: (v: string) => void;
  setFormSalle: (v: string) => void;
  setFormEnseignant: (v: string) => void;
}

export function CreateModal({
  show, formJour, formDebut, formFin, formMatiereId, formSalle, formEnseignant,
  formSubmitting, formError, matiereOptions, salleFixe, initialConflict,
  onClose, onSubmit, setFormJour, setFormDebut, setFormFin,
  setFormMatiereId, setFormSalle, setFormEnseignant,
}: CreateModalProps) {
  const [salleConflict, setSalleConflict] = useState(!!initialConflict);

  if (!show) return null;
  return (
    <div className="planning-modal-overlay" onClick={onClose}>
      <div className="planning-modal" onClick={e => e.stopPropagation()}>
        <div className="planning-modal-header">
          <h3>Nouveau créneau</h3>
          <div className="planning-modal-header-sub">{formJour} · {formDebut} – {formFin}</div>
          <button type="button" className="planning-modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="planning-modal-body">
          {formError && <Alert variant="error">{formError}</Alert>}
          <form onSubmit={onSubmit}>
            <FormGrid columns={2}>
              <Select label="Matière *" value={formMatiereId} onChange={e => setFormMatiereId(e.target.value)} options={matiereOptions} placeholder="Choisir" />
              <Input label="Enseignant" value={formEnseignant} onChange={e => setFormEnseignant(e.target.value)} placeholder="M. Dupont" />
            </FormGrid>
            <FormGrid columns={3}>
              <Select label="Jour" value={formJour} onChange={e => setFormJour(e.target.value as JourSemaine)} options={JOUR_OPTIONS} />
              <Select label="Début" value={formDebut} onChange={e => setFormDebut(e.target.value)} options={HEURE_OPTIONS} />
              <Select label="Fin" value={formFin} onChange={e => setFormFin(e.target.value)} options={HEURE_OPTIONS} />
            </FormGrid>
            <SalleSelect
              jour={formJour}
              heureDebut={formDebut}
              heureFin={formFin}
              value={formSalle}
              onChange={setFormSalle}
              salleFixe={salleFixe}
              disabled={formSubmitting}
              initialConflict={initialConflict}
              onConflictChange={setSalleConflict}
            />
            <FormActions>
              <Button type="button" variant="secondary" onClick={onClose}>Annuler</Button>
              <Button
                type="submit"
                variant="primary"
                disabled={formSubmitting || !formMatiereId || !formSalle || salleConflict}
                loading={formSubmitting}
              >
                Créer le créneau
              </Button>
            </FormActions>
          </form>
        </div>
      </div>
    </div>
  );
}

// ─── Edit modal ───────────────────────────────────────────────────────────────
interface EditModalProps {
  show: boolean; editCreneau: any;
  editMatiereId: string; editJour: JourSemaine; editDebut: string; editFin: string;
  editSalle: string; editEnseignant: string;
  editSubmitting: boolean; editError: string;
  matiereOptions: SelectOption[];
  salleFixe?: string;
  initialConflict: SalleOccupant | null;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  setEditMatiereId: (v: string) => void;
  setEditJour: (v: JourSemaine) => void;
  setEditDebut: (v: string) => void;
  setEditFin: (v: string) => void;
  setEditSalle: (v: string) => void;
  setEditEnseignant: (v: string) => void;
}

export function EditModal({
  show, editCreneau, editMatiereId, editJour, editDebut, editFin,
  editSalle, editEnseignant, editSubmitting, editError, matiereOptions, salleFixe,
  initialConflict,
  onClose, onSubmit, setEditMatiereId, setEditJour, setEditDebut, setEditFin,
  setEditSalle, setEditEnseignant,
}: EditModalProps) {
  const [salleConflict, setSalleConflict] = useState(!!initialConflict);

  if (!show || !editCreneau) return null;
  return (
    <div className="planning-modal-overlay" onClick={onClose}>
      <div className="planning-modal" onClick={e => e.stopPropagation()}>
        <div className="planning-modal-header">
          <h3>Modifier le créneau</h3>
          <div className="planning-modal-header-sub" style={{ color: editCreneau.matiere_couleur }}>● {editCreneau.matiere_nom}</div>
          <button type="button" className="planning-modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="planning-modal-body">
          {editError && <Alert variant="error">{editError}</Alert>}
          <form onSubmit={onSubmit}>
            <FormGrid columns={2}>
              <Select label="Matière *" value={editMatiereId} onChange={e => setEditMatiereId(e.target.value)} options={matiereOptions} placeholder="Choisir" />
              <Input label="Enseignant" value={editEnseignant} onChange={e => setEditEnseignant(e.target.value)} placeholder="M. Dupont" />
            </FormGrid>
            <FormGrid columns={3}>
              <Select label="Jour" value={editJour} onChange={e => setEditJour(e.target.value as JourSemaine)} options={JOUR_OPTIONS} />
              <Select label="Début" value={editDebut} onChange={e => setEditDebut(e.target.value)} options={HEURE_OPTIONS} />
              <Select label="Fin" value={editFin} onChange={e => setEditFin(e.target.value)} options={HEURE_OPTIONS} />
            </FormGrid>
            <SalleSelect
              jour={editJour}
              heureDebut={editDebut}
              heureFin={editFin}
              value={editSalle}
              onChange={setEditSalle}
              excludeCreneauId={editCreneau?.id}
              salleFixe={salleFixe}
              disabled={editSubmitting}
              initialConflict={initialConflict}
              onConflictChange={setSalleConflict}
            />
            <FormActions>
              <Button type="button" variant="secondary" onClick={onClose}>Annuler</Button>
              <Button
                type="submit"
                variant="primary"
                disabled={editSubmitting || !editMatiereId || !editSalle || salleConflict}
                loading={editSubmitting}
              >
                Enregistrer
              </Button>
            </FormActions>
          </form>
        </div>
      </div>
    </div>
  );
}

// ─── Move modal ───────────────────────────────────────────────────────────────
interface MoveModalProps {
  show: boolean; moveCreneau: any; moveTarget: { jour: string; heure: string } | null; moveDragSlot: string | null;
  onConfirm: (moveAll: boolean) => void;
  onCancel: () => void;
}

export function MoveModal({ show, moveCreneau, moveTarget, moveDragSlot, onConfirm, onCancel }: MoveModalProps) {
  if (!show || !moveCreneau || !moveTarget) return null;
  return (
    <div className="planning-modal-overlay" onClick={onCancel}>
      <div className="planning-modal planning-modal-sm" onClick={e => e.stopPropagation()}>
        <div className="planning-modal-header">
          <h3>Déplacer</h3>
          <button type="button" className="planning-modal-close" onClick={onCancel}>✕</button>
        </div>
        <div className="planning-modal-body">
          <div className="planning-move-info">
            <span className="planning-move-badge" style={{ background: moveCreneau.matiere_couleur }}>{moveCreneau.matiere_nom}</span>
            <span className="planning-move-arrow">→</span>
            <span>{moveTarget.jour} {moveTarget.heure}</span>
          </div>
          {moveDragSlot && moveDragSlot !== moveCreneau.heure_debut && (
            <div className="planning-move-hint">
              Plage saisie : <strong>{moveDragSlot}</strong> (dans un bloc {moveCreneau.heure_debut}–{moveCreneau.heure_fin})
            </div>
          )}
          <div className="planning-move-actions">
            <button type="button" className="planning-move-btn planning-move-btn-primary" onClick={() => onConfirm(true)}>
              <span className="planning-move-btn-icon">⬛</span>
              <div>
                <div className="planning-move-btn-label">Tout le bloc</div>
                <div className="planning-move-btn-sub">Déplacer depuis {moveDragSlot || moveCreneau.heure_debut} jusqu'à la fin</div>
              </div>
            </button>
            <button type="button" className="planning-move-btn planning-move-btn-secondary" onClick={() => onConfirm(false)}>
              <span className="planning-move-btn-icon">⬜</span>
              <div>
                <div className="planning-move-btn-label">Ce créneau seulement</div>
                <div className="planning-move-btn-sub">
                  {moveDragSlot || moveCreneau.heure_debut}–{moveDragSlot ? nextSlot(moveDragSlot) : moveCreneau.heure_fin} uniquement
                </div>
              </div>
            </button>
            <button type="button" className="planning-move-btn-cancel" onClick={onCancel}>Annuler</button>
          </div>
        </div>
      </div>
    </div>
  );
}
