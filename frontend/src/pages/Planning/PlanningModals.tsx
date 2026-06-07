import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert } from '../../components/shared/Alert';
import { Select, SelectOption } from '../../components/shared/Select';
import { Button } from '../../components/shared/Button';
import { FormGrid, FormActions } from '../../components/shared/FormGrid';
import { JourSemaine } from '../../types';
import { HEURES, nextSlot } from './planning.helpers';
import { SalleSelect } from './SalleSelect';
import { SalleOccupant } from './planning.types';

function ProfDisplay({ matiereId, classeData, selectedClasse, onResolved }: {
  matiereId: string;
  classeData: any;
  selectedClasse: any;
  onResolved: (prof: { id: string; nom: string } | null) => void;
}) {
  const { t } = useTranslation();

  useEffect(() => {
    if (!matiereId || !selectedClasse) { onResolved(null); return; }
    const assignment = classeData?.assignments?.find((a: any) => a.matiere_id === matiereId);
    if (assignment?.professeur_id) {
      onResolved({ id: assignment.professeur_id, nom: assignment.professeur_nom || '' });
    } else {
      onResolved(null);
    }
  }, [matiereId, selectedClasse, classeData]);

  if (!matiereId) return null;

  const assignment = classeData?.assignments?.find((a: any) => a.matiere_id === matiereId);
  const profNom = assignment?.professeur_nom;

  return (
    <div>
      <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>{t('planning.modal.enseignant')}</label>
      {profNom
        ? <div style={{ fontSize: '0.9rem', fontWeight: 500, padding: '0.4rem 0' }}>{profNom}</div>
        : <div style={{ fontSize: '0.85rem', color: 'var(--warning)', padding: '0.4rem 0' }}>{t('planning.modal.aucunProf')}</div>
      }
    </div>
  );
}

// ─── Create modal ─────────────────────────────────────────────────────────────
interface CreateModalProps {
  show: boolean;
  formJour: JourSemaine; formDebut: string; formFin: string;
  formMatiereId: string; formSalle: string;
  profResolu: { id: string; nom: string } | null;
  formSubmitting: boolean; formError: string;
  matiereOptions: SelectOption[];
  salleFixe?: string;
  initialConflict: SalleOccupant | null;
  classeData: any;
  selectedClasse: any;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  setFormJour: (v: JourSemaine) => void;
  setFormDebut: (v: string) => void;
  setFormFin: (v: string) => void;
  setFormMatiereId: (v: string) => void;
  setFormSalle: (v: string) => void;
  setProfResolu: (v: { id: string; nom: string } | null) => void;
}

export function CreateModal({
  show, formJour, formDebut, formFin, formMatiereId, formSalle,
  formSubmitting, formError, matiereOptions, salleFixe, initialConflict,
  classeData, selectedClasse,
  onClose, onSubmit, setFormJour, setFormDebut, setFormFin,
  setFormMatiereId, setFormSalle, setProfResolu,
}: CreateModalProps) {
  const { t } = useTranslation();
  const JOUR_OPTIONS: SelectOption[] = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'].map(j => ({ value: j, label: j }));
  const HEURE_OPTIONS: SelectOption[] = HEURES.map(h => ({ value: h, label: h }));
  const [salleConflict, setSalleConflict] = useState(!!initialConflict);

  if (!show) return null;
  return (
    <div className="planning-modal-overlay" onClick={onClose}>
      <div className="planning-modal" onClick={e => e.stopPropagation()}>
        <div className="planning-modal-header">
          <h3>{t('planning.modal.nouveauCreneau')}</h3>
          <div className="planning-modal-header-sub">{formJour} · {formDebut} – {formFin}</div>
          <button type="button" className="planning-modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="planning-modal-body">
          {formError && <Alert variant="error">{formError}</Alert>}
          <form onSubmit={onSubmit}>
            <FormGrid columns={2}>
              <Select label={t('planning.modal.matiere')} value={formMatiereId} onChange={e => setFormMatiereId(e.target.value)} options={matiereOptions} placeholder={t('planning.modal.choisir')} />
              <ProfDisplay
                matiereId={formMatiereId}
                classeData={classeData}
                selectedClasse={selectedClasse}
                onResolved={setProfResolu}
              />
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
            <FormGrid columns={3}>
              <Select label={t('planning.modal.jour')} value={formJour} onChange={e => setFormJour(e.target.value as JourSemaine)} options={JOUR_OPTIONS} />
              <Select label={t('planning.modal.debut')} value={formDebut} onChange={e => setFormDebut(e.target.value)} options={HEURE_OPTIONS} />
              <Select label={t('planning.modal.fin')} value={formFin} onChange={e => setFormFin(e.target.value)} options={HEURE_OPTIONS} />
            </FormGrid>
            <FormActions>
              <Button type="button" variant="secondary" onClick={onClose}>{t('planning.modal.annuler')}</Button>
              <Button
                type="submit"
                variant="primary"
                disabled={formSubmitting || !formMatiereId || !formSalle || salleConflict}
                loading={formSubmitting}
              >
                {t('planning.modal.creer')}
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
  editSalle: string; editProfResolu: { id: string; nom: string } | null;
  editSubmitting: boolean; editError: string;
  matiereOptions: SelectOption[];
  salleFixe?: string;
  initialConflict: SalleOccupant | null;
  classeData: any;
  selectedClasse: any;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  setEditMatiereId: (v: string) => void;
  setEditJour: (v: JourSemaine) => void;
  setEditDebut: (v: string) => void;
  setEditFin: (v: string) => void;
  setEditSalle: (v: string) => void;
  setEditProfResolu: (v: { id: string; nom: string } | null) => void;
}

export function EditModal({
  show, editCreneau, editMatiereId, editJour, editDebut, editFin,
  editSalle, editSubmitting, editError, matiereOptions, salleFixe,
  initialConflict, classeData, selectedClasse,
  onClose, onSubmit, setEditMatiereId, setEditJour, setEditDebut, setEditFin,
  setEditSalle, setEditProfResolu,
}: EditModalProps) {
  const { t } = useTranslation();
  const JOUR_OPTIONS: SelectOption[] = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'].map(j => ({ value: j, label: j }));
  const HEURE_OPTIONS: SelectOption[] = HEURES.map(h => ({ value: h, label: h }));
  const [salleConflict, setSalleConflict] = useState(!!initialConflict);

  if (!show || !editCreneau) return null;
  return (
    <div className="planning-modal-overlay" onClick={onClose}>
      <div className="planning-modal" onClick={e => e.stopPropagation()}>
        <div className="planning-modal-header">
          <h3>{t('planning.modal.modifierCreneau')}</h3>
          <div className="planning-modal-header-sub" style={{ color: editCreneau.matiere_couleur }}>● {editCreneau.matiere_nom}</div>
          <button type="button" className="planning-modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="planning-modal-body">
          {editError && <Alert variant="error">{editError}</Alert>}
          <form onSubmit={onSubmit}>
            <FormGrid columns={2}>
              <Select label={t('planning.modal.matiere')} value={editMatiereId} onChange={e => setEditMatiereId(e.target.value)} options={matiereOptions} placeholder={t('planning.modal.choisir')} />
              <ProfDisplay
                matiereId={editMatiereId}
                classeData={classeData}
                selectedClasse={selectedClasse}
                onResolved={setEditProfResolu}
              />
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
            <FormGrid columns={3}>
              <Select label={t('planning.modal.jour')} value={editJour} onChange={e => setEditJour(e.target.value as JourSemaine)} options={JOUR_OPTIONS} />
              <Select label={t('planning.modal.debut')} value={editDebut} onChange={e => setEditDebut(e.target.value)} options={HEURE_OPTIONS} />
              <Select label={t('planning.modal.fin')} value={editFin} onChange={e => setEditFin(e.target.value)} options={HEURE_OPTIONS} />
            </FormGrid>
            <FormActions>
              <Button type="button" variant="secondary" onClick={onClose}>{t('planning.modal.annuler')}</Button>
              <Button
                type="submit"
                variant="primary"
                disabled={editSubmitting || !editMatiereId || !editSalle || salleConflict}
                loading={editSubmitting}
              >
                {t('planning.modal.enregistrer')}
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
  const { t } = useTranslation();
  if (!show || !moveCreneau || !moveTarget) return null;
  return (
    <div className="planning-modal-overlay" onClick={onCancel}>
      <div className="planning-modal planning-modal-sm" onClick={e => e.stopPropagation()}>
        <div className="planning-modal-header">
          <h3>{t('planning.modal.deplacer')}</h3>
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
              {t('planning.modal.plageInfo', { slot: moveDragSlot, debut: moveCreneau.heure_debut, fin: moveCreneau.heure_fin })}
            </div>
          )}
          <div className="planning-move-actions">
            <button type="button" className="planning-move-btn planning-move-btn-primary" onClick={() => onConfirm(true)}>
              <span className="planning-move-btn-icon">⬛</span>
              <div>
                <div className="planning-move-btn-label">{t('planning.modal.toutBloc')}</div>
                <div className="planning-move-btn-sub">{t('planning.modal.toutBlocSub', { slot: moveDragSlot || moveCreneau.heure_debut })}</div>
              </div>
            </button>
            <button type="button" className="planning-move-btn planning-move-btn-secondary" onClick={() => onConfirm(false)}>
              <span className="planning-move-btn-icon">⬜</span>
              <div>
                <div className="planning-move-btn-label">{t('planning.modal.ceCreneauSeulement')}</div>
                <div className="planning-move-btn-sub">
                  {t('planning.modal.ceCreneauSub', { debut: moveDragSlot || moveCreneau.heure_debut, fin: moveDragSlot ? nextSlot(moveDragSlot) : moveCreneau.heure_fin })}
                </div>
              </div>
            </button>
            <button type="button" className="planning-move-btn-cancel" onClick={onCancel}>{t('planning.modal.annuler')}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
