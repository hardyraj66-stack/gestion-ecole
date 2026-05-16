import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { usePlanning } from '../../contexts/PlanningContext';
import { usePlanningClasses, usePlanningClasse } from '../../hooks/usePageData';
import { PageHeader } from '../../components/ui/PageHeader';
import { PageLoader } from '../../components/ui/PageLoader';
import { EmptyState } from '../../components/ui/EmptyState';
import { Card } from '../../components/shared/Card';
import { Button } from '../../components/shared/Button';
import { Badge } from '../../components/ui/Badge';
import { Alert } from '../../components/shared/Alert';
import { Icon, Icons } from '../../components/shared/Icon';
import { Input } from '../../components/shared/Input';
import { Select, SelectOption } from '../../components/shared/Select';
import { FormGrid, FormActions } from '../../components/shared/FormGrid';
import { StatItem } from '../../components/shared/StatItem';
import { ListItem } from '../../components/shared/ListItem';
import { Popover } from '../../components/shared/Popover';
import { useConfirm } from '../../components/shared/ConfirmDialog';
import { Creneau, JourSemaine } from '../../types';
import { generatePlanningHours, calculateDuration } from '../../utils/helpers';

const JOURS: JourSemaine[] = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
const HEURES = generatePlanningHours();
const JOUR_OPTIONS: SelectOption[] = JOURS.map(j => ({ value: j, label: j }));
const HEURE_OPTIONS: SelectOption[] = HEURES.map(h => ({ value: h, label: h }));
const NIVEAUX_ORDRE = ['CP','CE1','CE2','CM1','CM2','6ème','5ème','4ème','3ème','2nde','1ère','Terminale'];

// Plage bloquée pause déjeuner
const isBreakSlot = (h: string) => h === '12:00' || h === '12:30';
const breaksOverlap = (start: string, end: string) => {
  const s = toMin(start), e = toMin(end);
  const bs = toMin('12:00'), be = toMin('12:30');
  return s < be && e > bs;
};
function toMin(t: string) { const [h, m] = t.split(':').map(Number); return h * 60 + m; }
function nextSlot(h: string) {
  const i = HEURES.indexOf(h);
  return i < HEURES.length - 1 ? HEURES[i + 1] : h;
}

export function Planning() {
  const { id } = useParams<{ id: string }>();
  const { createWithError, update: updateCreneau, delete: deleteCreneau } = usePlanning();
  const confirm = useConfirm();

  const [selectedClasseId, setSelectedClasseId] = useState<string>(id || '');
  const [openNiveau, setOpenNiveau] = useState<string | null>(null);

  // Sélection par glisser
  const [selecting, setSelecting] = useState(false);
  const [selStart, setSelStart] = useState<{ jour: JourSemaine; heure: string } | null>(null);
  const [selEnd, setSelEnd] = useState<string | null>(null);

  // Popup création
  const [showCreatePopup, setShowCreatePopup] = useState(false);
  const [formJour, setFormJour] = useState<JourSemaine>('Lundi');
  const [formDebut, setFormDebut] = useState('08:00');
  const [formFin, setFormFin] = useState('09:00');
  const [formMatiereId, setFormMatiereId] = useState('');
  const [formSalle, setFormSalle] = useState('');
  const [formEnseignant, setFormEnseignant] = useState('');
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Drag-and-drop
  const [dragging, setDragging] = useState<any>(null);
  const [showMovePopover, setShowMovePopover] = useState(false);
  const [moveTarget, setMoveTarget] = useState<{ jour: JourSemaine; heure: string } | null>(null);
  const [moveCreneau, setMoveCreneau] = useState<any>(null);

  const [error, setError] = useState('');

  useEffect(() => { if (id) setSelectedClasseId(id); }, [id]);

  const { data: classesData, loading: classesLoading, readOnly } = usePlanningClasses();
  const { data: classeData, loading: classeLoading } = usePlanningClasse(selectedClasseId);

  const niveaux = useMemo(() => {
    if (!classesData?.classes) return [];
    const map = new Map<string, any[]>();
    for (const c of classesData.classes) { const n = c.niveau || 'Autre'; if (!map.has(n)) map.set(n, []); map.get(n)!.push(c); }
    return Array.from(map.entries())
      .sort(([a], [b]) => { const ia = NIVEAUX_ORDRE.indexOf(a), ib = NIVEAUX_ORDRE.indexOf(b); if (ia === -1 && ib === -1) return a.localeCompare(b); if (ia === -1) return 1; if (ib === -1) return -1; return ia - ib; })
      .map(([niveau, classes]) => ({ niveau, classes }));
  }, [classesData]);

  if (classesLoading) return <PageLoader />;
  if (!classesData) return <Alert variant="error">Problème de chargement.</Alert>;

  const selectedClasse = classeData?.classe || null;
  const classeCreneaux: any[] = classeData?.creneaux || [];
  const allMatieres: any[] = classeData?.matieres || [];
  const totalHeures = classeCreneaux.reduce((t: number, c: any) => t + calculateDuration(c.heure_debut, c.heure_fin), 0);
  const getCreneaux = (j: JourSemaine, h: string) => classeCreneaux.filter((c: any) => c.jour === j && c.heure_debut === h);
  const matiereOptions: SelectOption[] = allMatieres.map((m: any) => ({ value: m.id, label: m.nom }));
  const selectedNiveau = selectedClasse?.niveau || null;

  const handleSelectClasse = (cid: string) => { setSelectedClasseId(cid); setOpenNiveau(null); setError(''); };

  // ===== SÉLECTION PAR GLISSER =====
  const isInSelection = (jour: JourSemaine, heure: string) => {
    if (!selStart || !selEnd || selStart.jour !== jour) return false;
    const si = HEURES.indexOf(selStart.heure), ei = HEURES.indexOf(selEnd), ci = HEURES.indexOf(heure);
    return ci >= Math.min(si, ei) && ci <= Math.max(si, ei);
  };

  const handleCellMouseDown = (jour: JourSemaine, heure: string) => {
    if (readOnly || !selectedClasse) return;
    if (isBreakSlot(heure)) { setError('⏸ Cette plage (12h00–12h30) est réservée à la pause.'); return; }
    if (getCreneaux(jour, heure).length > 0) return; // occupée
    setSelecting(true);
    setSelStart({ jour, heure });
    setSelEnd(heure);
    setError('');
  };

  const handleCellMouseEnter = (jour: JourSemaine, heure: string) => {
    if (!selecting || !selStart || selStart.jour !== jour) return;
    if (isBreakSlot(heure)) return; // ne pas étendre sur la pause
    setSelEnd(heure);
  };

  const handleCellMouseUp = () => {
    if (!selecting || !selStart || !selEnd) { setSelecting(false); return; }
    setSelecting(false);

    const si = HEURES.indexOf(selStart.heure), ei = HEURES.indexOf(selEnd);
    const startH = HEURES[Math.min(si, ei)];
    const endH = nextSlot(HEURES[Math.max(si, ei)]);

    if (breaksOverlap(startH, endH)) { setError('⏸ La sélection chevauche la pause déjeuner (12h00–12h30).'); setSelStart(null); setSelEnd(null); return; }

    setFormJour(selStart.jour);
    setFormDebut(startH);
    setFormFin(endH);
    setFormSalle(selectedClasse?.salle || '');
    setFormMatiereId('');
    setFormEnseignant('');
    setFormError('');
    setShowCreatePopup(true);
    setSelStart(null);
    setSelEnd(null);
  };

  // Annuler la sélection si on sort de la grille
  const handleGridMouseLeave = () => { if (selecting) { setSelecting(false); setSelStart(null); setSelEnd(null); } };

  // ===== POPUP CRÉATION =====
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formMatiereId || !formSalle || !selectedClasse) return;
    if (breaksOverlap(formDebut, formFin)) { setFormError('Le créneau chevauche la pause 12h00–12h30.'); return; }
    const mat = allMatieres.find((m: any) => m.id === formMatiereId);
    if (!mat) return;
    setFormSubmitting(true); setFormError('');
    await createWithError(
      { classe_id: selectedClasse.id, matiere_id: formMatiereId, matiere_nom: mat.nom, matiere_couleur: mat.couleur || '#2563eb', jour: formJour, heure_debut: formDebut, heure_fin: formFin, salle: formSalle, enseignant: formEnseignant.trim() },
      () => { setShowCreatePopup(false); },
      (err) => { setFormError(err); },
    );
    setFormSubmitting(false);
  };

  // ===== DRAG AND DROP =====
  const handleDragStart = (e: React.DragEvent, cr: any) => {
    if (readOnly) { e.preventDefault(); return; }
    setDragging(cr);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, _jour: JourSemaine, heure: string) => {
    if (!dragging || isBreakSlot(heure)) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e: React.DragEvent, jour: JourSemaine, heure: string) => {
    e.preventDefault();
    if (!dragging) return;

    if (isBreakSlot(heure)) { setError('⏸ Impossible de déplacer sur la pause (12h00–12h30).'); setDragging(null); return; }

    const duration = toMin(dragging.heure_fin) - toMin(dragging.heure_debut);
    const newEnd = HEURES.find(h => toMin(h) === toMin(heure) + duration) || dragging.heure_fin;

    if (breaksOverlap(heure, newEnd)) { setError('⏸ Le créneau déplacé chevaucherait la pause déjeuner.'); setDragging(null); return; }

    setMoveCreneau(dragging);
    setMoveTarget({ jour, heure });
    setShowMovePopover(true);
    setDragging(null);
  };

  const handleMoveConfirm = async (moveAll: boolean) => {
    if (!moveCreneau || !moveTarget) return;
    setShowMovePopover(false);

    const duration = toMin(moveCreneau.heure_fin) - toMin(moveCreneau.heure_debut);
    const newEnd = HEURES.find(h => toMin(h) === toMin(moveTarget.heure) + duration) || moveCreneau.heure_fin;

    if (moveAll) {
      // Déplacer tous les créneaux de la même matière du même jour
      const sameMatiereCreneaux = classeCreneaux.filter((c: any) => c.matiere_id === moveCreneau.matiere_id && c.jour === moveCreneau.jour);
      for (const cr of sameMatiereCreneaux) {
        const offset = toMin(cr.heure_debut) - toMin(moveCreneau.heure_debut);
        const nStart = HEURES.find(h => toMin(h) === toMin(moveTarget.heure) + offset);
        const nEnd = HEURES.find(h => toMin(h) === toMin(moveTarget.heure) + offset + (toMin(cr.heure_fin) - toMin(cr.heure_debut)));
        if (nStart && nEnd) await updateCreneau(cr.id, { jour: moveTarget.jour, heure_debut: nStart, heure_fin: nEnd });
      }
    } else {
      await updateCreneau(moveCreneau.id, { jour: moveTarget.jour, heure_debut: moveTarget.heure, heure_fin: newEnd });
    }

    setMoveCreneau(null);
    setMoveTarget(null);
  };

  // ===== DELETE =====
  const handleDeleteCreneau = async (cr: Creneau) => {
    if (readOnly) return;
    const ok = await confirm({ title: 'Supprimer', message: `Supprimer ${cr.matiere_nom} (${cr.jour} ${cr.heure_debut}–${cr.heure_fin}) ?`, confirmText: 'Supprimer', variant: 'danger' });
    if (ok) deleteCreneau(cr.id);
  };

  return (
    <div>
      <PageHeader title="Planning" subtitle={selectedClasse ? `Emploi du temps de ${selectedClasse.nom}` : 'Sélectionnez un niveau puis une classe'} />

      {error && <Alert variant="warning">{error}</Alert>}

      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '1.5rem' }}>
        {/* ===== SIDEBAR ===== */}
        <div>
          <Card>
            <h3 style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Niveaux</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {niveaux.map(({ niveau, classes: nClasses }) => (
                <Popover key={niveau} open={openNiveau === niveau} onClose={() => setOpenNiveau(null)}
                  trigger={
                    <div className={`niveau-item ${selectedNiveau === niveau ? 'niveau-item-selected' : openNiveau === niveau ? 'niveau-item-active' : ''}`} onClick={() => setOpenNiveau(openNiveau === niveau ? null : niveau)}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><span>{niveau}</span><Badge label={`${nClasses.length}`} variant={selectedNiveau === niveau ? 'primary' : 'default'} /></div>
                      <span className="niveau-item-arrow">▾</span>
                    </div>
                  }>
                  <div style={{ padding: '0.35rem 0' }}>
                    <div style={{ padding: '0.4rem 0.85rem', fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Classes — {niveau}</div>
                    {nClasses.map((c: any) => (
                      <ListItem key={c.id} title={c.nom} subtitle={c.salle} selected={c.id === selectedClasseId} onClick={() => handleSelectClasse(c.id)}
                        trailing={<Badge label={`${c._creneauxCount || 0}`} variant={c.id === selectedClasseId ? 'primary' : 'default'} />} />
                    ))}
                  </div>
                </Popover>
              ))}
            </div>
            {selectedClasse && (
              <div style={{ marginTop: '1rem', padding: '0.65rem 0.85rem', background: 'var(--primary-light)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--primary)' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--primary)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.2rem' }}>Sélection</div>
                <div style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--primary)' }}>{selectedClasse.nom}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{selectedClasse.niveau} • {selectedClasse.salle}</div>
              </div>
            )}
            {selectedClasse && !readOnly && (
              <p style={{ marginTop: '0.75rem', fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                💡 Cliquez et glissez sur les cases vides pour créer un créneau. Glissez-déposez un créneau existant pour le déplacer.
              </p>
            )}
          </Card>
        </div>

        {/* ===== CONTENU ===== */}
        <div>
          {!selectedClasseId ? (
            <Card><EmptyState icon={<Icon path={Icons.calendar} size={28} />} message="Sélectionnez un niveau puis une classe" /></Card>
          ) : classeLoading ? (
            <PageLoader />
          ) : !selectedClasse ? (
            <Card><EmptyState icon={<Icon path={Icons.warning} size={28} />} message="Classe introuvable" /></Card>
          ) : (
            <>
              <Card style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', flexWrap: 'wrap' }}>
                  <StatItem label="Classe" value={selectedClasse.nom} />
                  <StatItem label="Créneaux" value={classeCreneaux.length} />
                  <StatItem label="Heures/sem" value={`${totalHeures}h`} />
                  <StatItem label="Mode" value={<Badge label={selectedClasse.salle_type === 'fixe' ? 'Fixe' : 'Variable'} variant={selectedClasse.salle_type === 'fixe' ? 'info' : 'warning'} />} />
                </div>
              </Card>

              <Card padding="none">
                <div style={{ overflowX: 'auto' }} onMouseLeave={handleGridMouseLeave}>
                  <table className="planning-table planning-interactive">
                    <thead><tr><th>Horaire</th>{JOURS.map(j => <th key={j}>{j}</th>)}</tr></thead>
                    <tbody>
                      {HEURES.map(h => {
                        const isBreak = isBreakSlot(h);
                        return (
                          <tr key={h} className={isBreak ? 'planning-break-row' : ''}>
                            <td className={isBreak ? 'planning-break-cell' : ''}>
                              {h}
                              {isBreak && <span className="planning-break-label">pause</span>}
                            </td>
                            {JOURS.map(j => {
                              const cc = getCreneaux(j, h);
                              const inSel = isInSelection(j, h);
                              const isEmpty = cc.length === 0 && !isBreak;

                              return (
                                <td
                                  key={`${j}-${h}`}
                                  className={`${isBreak ? 'planning-break-cell' : ''} ${inSel ? 'planning-cell-selected' : ''} ${isEmpty && !readOnly ? 'planning-cell-empty' : ''}`}
                                  onMouseDown={() => isEmpty && handleCellMouseDown(j, h)}
                                  onMouseEnter={() => selecting && handleCellMouseEnter(j, h)}
                                  onMouseUp={handleCellMouseUp}
                                  onDragOver={e => handleDragOver(e, j, h)}
                                  onDrop={e => handleDrop(e, j, h)}
                                >
                                  {isBreak && cc.length === 0 && <div className="planning-break-indicator">🍽</div>}
                                  {cc.map((cr: any) => (
                                    <div
                                      key={cr.id}
                                      className="creneau-block"
                                      style={{ backgroundColor: cr.matiere_couleur }}
                                      draggable={!readOnly}
                                      onDragStart={e => handleDragStart(e, cr)}
                                    >
                                      <div className="creneau-block-title">{cr.matiere_nom}</div>
                                      <div className="creneau-block-time">{cr.heure_debut}–{cr.heure_fin}</div>
                                      <div className="creneau-block-salle">{cr.salle}</div>
                                      {!readOnly && <button type="button" className="creneau-block-delete" onClick={(e) => { e.stopPropagation(); handleDeleteCreneau(cr); }}>✕</button>}
                                    </div>
                                  ))}
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </Card>
            </>
          )}
        </div>
      </div>

      {/* ===== POPUP CRÉATION ===== */}
      {showCreatePopup && (
        <div className="classe-popup-overlay" onClick={() => setShowCreatePopup(false)}>
          <div className="classe-popup" style={{ maxWidth: '520px' }} onClick={e => e.stopPropagation()}>
            <div className="classe-popup-header">
              <h3>Nouveau créneau — {formJour} {formDebut}–{formFin}</h3>
              <button type="button" className="classe-popup-close" onClick={() => setShowCreatePopup(false)}>✕</button>
            </div>
            <div style={{ padding: '1.25rem' }}>
              {formError && <Alert variant="error">{formError}</Alert>}
              <form onSubmit={handleCreateSubmit}>
                <FormGrid columns={2}>
                  <Select label="Matière *" value={formMatiereId} onChange={e => setFormMatiereId(e.target.value)} options={matiereOptions} placeholder="Choisir" />
                  <Input label="Enseignant" value={formEnseignant} onChange={e => setFormEnseignant(e.target.value)} placeholder="M. Dupont" />
                </FormGrid>
                <FormGrid columns={3}>
                  <Select label="Jour" value={formJour} onChange={e => setFormJour(e.target.value as JourSemaine)} options={JOUR_OPTIONS} />
                  <Select label="Début" value={formDebut} onChange={e => setFormDebut(e.target.value)} options={HEURE_OPTIONS} />
                  <Select label="Fin" value={formFin} onChange={e => setFormFin(e.target.value)} options={HEURE_OPTIONS} />
                </FormGrid>
                <Input label="Salle *" value={formSalle} onChange={e => setFormSalle(e.target.value)} placeholder="Salle" />
                <FormActions>
                  <Button type="button" variant="secondary" onClick={() => setShowCreatePopup(false)}>Annuler</Button>
                  <Button type="submit" variant="primary" disabled={formSubmitting || !formMatiereId || !formSalle} loading={formSubmitting}>Créer le créneau</Button>
                </FormActions>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ===== POPOVER DÉPLACEMENT ===== */}
      {showMovePopover && moveCreneau && moveTarget && (
        <div className="classe-popup-overlay" onClick={() => { setShowMovePopover(false); setMoveCreneau(null); }}>
          <div className="classe-popup" style={{ maxWidth: '400px' }} onClick={e => e.stopPropagation()}>
            <div className="classe-popup-header">
              <h3>Déplacer le créneau</h3>
              <button type="button" className="classe-popup-close" onClick={() => { setShowMovePopover(false); setMoveCreneau(null); }}>✕</button>
            </div>
            <div style={{ padding: '1.25rem' }}>
              <p style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                <strong>{moveCreneau.matiere_nom}</strong> → {moveTarget.jour} à {moveTarget.heure}
              </p>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
                Que souhaitez-vous déplacer ?
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <Button variant="primary" onClick={() => handleMoveConfirm(false)} fullWidth>
                  Déplacer uniquement ce créneau
                </Button>
                <Button variant="outline" onClick={() => handleMoveConfirm(true)} fullWidth>
                  Déplacer tous les créneaux de {moveCreneau.matiere_nom} ({moveCreneau.jour})
                </Button>
                <Button variant="secondary" onClick={() => { setShowMovePopover(false); setMoveCreneau(null); }} fullWidth>
                  Annuler
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
