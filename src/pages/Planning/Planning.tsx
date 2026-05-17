import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { usePlanning } from '../../contexts/PlanningContext';
import { usePlanningClasses, usePlanningClasse } from '../../hooks/usePageData';
import { PageHeader } from '../../components/ui/PageHeader';
import { PageLoader } from '../../components/ui/PageLoader';
import { EmptyState } from '../../components/ui/EmptyState';
import { Card } from '../../components/shared/Card';
import { Badge } from '../../components/ui/Badge';
import { Alert } from '../../components/shared/Alert';
import { Icon, Icons } from '../../components/shared/Icon';
import { Input } from '../../components/shared/Input';
import { Select, SelectOption } from '../../components/shared/Select';
import { Button } from '../../components/shared/Button';
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

const isBreakSlot = (h: string) => h === '12:00' || h === '12:30';
const breaksOverlap = (start: string, end: string) => { const s = toMin(start), e = toMin(end); return s < toMin('12:30') && e > toMin('12:00'); };
function toMin(t: string) { const [h, m] = t.split(':').map(Number); return h * 60 + m; }
function nextSlot(h: string) { const i = HEURES.indexOf(h); return i < HEURES.length - 1 ? HEURES[i + 1] : h; }
function isOccupied(jour: JourSemaine, heure: string, creneaux: any[]) {
  const m = toMin(heure);
  return creneaux.some((c: any) => c.jour === jour && toMin(c.heure_debut) <= m && toMin(c.heure_fin) > m);
}

export function Planning() {
  const { id } = useParams<{ id: string }>();
  const { createWithError, update: updateCreneau, delete: deleteCreneau } = usePlanning();
  const confirm = useConfirm();

  const [selectedClasseId, setSelectedClasseId] = useState<string>(id || '');
  const [openNiveau, setOpenNiveau] = useState<string | null>(null);

  // Selection
  const [selecting, setSelecting] = useState(false);
  const [selStart, setSelStart] = useState<{ jour: JourSemaine; heure: string } | null>(null);
  const [selEnd, setSelEnd] = useState<string | null>(null);

  // Create popup (multi-slot only)
  const [showCreatePopup, setShowCreatePopup] = useState(false);
  const [formJour, setFormJour] = useState<JourSemaine>('Lundi');
  const [formDebut, setFormDebut] = useState('08:00');
  const [formFin, setFormFin] = useState('09:00');
  const [formMatiereId, setFormMatiereId] = useState('');
  const [formSalle, setFormSalle] = useState('');
  const [formEnseignant, setFormEnseignant] = useState('');
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // (inline slot supprimé — on utilise toujours le popup)

  // Drag-and-drop
  const [dragging, setDragging] = useState<any>(null);
  const [showMovePopover, setShowMovePopover] = useState(false);
  const [moveTarget, setMoveTarget] = useState<{ jour: JourSemaine; heure: string } | null>(null);
  const [moveCreneau, setMoveCreneau] = useState<any>(null);

  // Resize
  const [resizing, setResizing] = useState<{ cr: any; edge: 'top' | 'bottom' } | null>(null);
  const [resizeHeure, setResizeHeure] = useState<string | null>(null);

  const [error, setError] = useState('');

  useEffect(() => { if (id) setSelectedClasseId(id); }, [id]);

  const { data: classesData, loading: classesLoading, readOnly } = usePlanningClasses();
  const { data: classeData, loading: classeLoading, refreshing: classeRefreshing } = usePlanningClasse(selectedClasseId);

  const niveaux = useMemo(() => {
    if (!classesData?.classes) return [];
    const map = new Map<string, any[]>();
    for (const c of classesData.classes) { const n = c.niveau || 'Autre'; if (!map.has(n)) map.set(n, []); map.get(n)!.push(c); }
    return Array.from(map.entries())
      .sort(([a], [b]) => { const ia = NIVEAUX_ORDRE.indexOf(a), ib = NIVEAUX_ORDRE.indexOf(b); if (ia === -1 && ib === -1) return a.localeCompare(b); if (ia === -1) return 1; if (ib === -1) return -1; return ia - ib; })
      .map(([niveau, classes]) => ({ niveau, classes }));
  }, [classesData]);

  // Extraire les données AVANT tout return conditionnel (Rules of Hooks)
  const allClasses = classesData?.classes || [];
  const selectedClasseFromList = allClasses.find((c: any) => c.id === selectedClasseId) || null;
  const selectedClasse = classeData?.classe || selectedClasseFromList || null;
  const classeCreneaux: any[] = classeData?.creneaux || [];
  const allMatieres: any[] = classeData?.matieres || [];
  const totalHeures = classeCreneaux.reduce((t: number, c: any) => t + calculateDuration(c.heure_debut, c.heure_fin), 0);
  const matiereOptions: SelectOption[] = allMatieres.map((m: any) => ({ value: m.id, label: m.nom }));
  const selectedNiveau = selectedClasse?.niveau || null;

  // Map chaque cellule couverte vers le créneau qui l'occupe
  const cellCreneauMap = useMemo(() => {
    const map = new Map<string, any>();
    for (const cr of classeCreneaux) {
      const si = HEURES.indexOf(cr.heure_debut);
      const ei = HEURES.findIndex(h => h === cr.heure_fin);
      const end = ei > si ? ei : si + 1;
      for (let i = si; i < end; i++) {
        map.set(`${cr.jour}-${HEURES[i]}`, { ...cr, _isStart: i === si });
      }
    }
    return map;
  }, [classeCreneaux]);

  // Guards APRÈS tous les hooks
  if (classesLoading) return <PageLoader />;
  if (!classesData) return <Alert variant="error">Problème de chargement.</Alert>;

  const handleSelectClasse = (cid: string) => { setSelectedClasseId(cid); setOpenNiveau(null); setError(''); };

  // ===== SELECTION =====
  const isInSelection = (jour: JourSemaine, heure: string) => {
    if (!selStart || !selEnd || selStart.jour !== jour) return false;
    const si = HEURES.indexOf(selStart.heure), ei = HEURES.indexOf(selEnd), ci = HEURES.indexOf(heure);
    return ci >= Math.min(si, ei) && ci <= Math.max(si, ei);
  };

  const handleCellMouseDown = (jour: JourSemaine, heure: string) => {
    if (readOnly || !selectedClasse) return;
    if (isBreakSlot(heure)) { setError('⏸ Plage réservée à la pause.'); return; }
    if (isOccupied(jour, heure, classeCreneaux)) return;
    setSelecting(true); setSelStart({ jour, heure }); setSelEnd(heure); setError('');
  };

  const handleCellMouseEnter = (jour: JourSemaine, heure: string) => {
    if (!selecting || !selStart || selStart.jour !== jour) return;
    if (isBreakSlot(heure) || isOccupied(jour, heure, classeCreneaux)) return;
    setSelEnd(heure);
  };

  const handleCellMouseUp = () => {
    if (!selecting || !selStart || !selEnd) { setSelecting(false); return; }
    setSelecting(false);

    const si = HEURES.indexOf(selStart.heure), ei = HEURES.indexOf(selEnd);
    const startH = HEURES[Math.min(si, ei)];
    const endH = nextSlot(HEURES[Math.max(si, ei)]);

    if (breaksOverlap(startH, endH)) { setError('⏸ Chevauche la pause.'); setSelStart(null); setSelEnd(null); return; }

    // Toujours ouvrir le popup (single ou multi)
    setFormJour(selStart.jour); setFormDebut(startH); setFormFin(endH);
    setFormSalle(selectedClasse?.salle || ''); setFormMatiereId(''); setFormEnseignant(''); setFormError('');
    setShowCreatePopup(true);
    setSelStart(null); setSelEnd(null);
  };

  const handleGridMouseLeave = () => { if (selecting) { setSelecting(false); setSelStart(null); setSelEnd(null); } };

  // ===== CREATE (shared logic) =====
  const doCreate = async () => {
    if (!formMatiereId || !formSalle || !selectedClasse) return;
    if (breaksOverlap(formDebut, formFin)) { setFormError('Chevauche la pause.'); return; }
    const mat = allMatieres.find((m: any) => m.id === formMatiereId);
    if (!mat) return;
    setFormSubmitting(true); setFormError('');
    await createWithError(
      { classe_id: selectedClasse.id, matiere_id: formMatiereId, matiere_nom: mat.nom, matiere_couleur: mat.couleur || '#2563eb', jour: formJour, heure_debut: formDebut, heure_fin: formFin, salle: formSalle, enseignant: formEnseignant.trim() },
      () => { setShowCreatePopup(false); },
      (err) => setFormError(err),
    );
    setFormSubmitting(false);
  };

  const handleCreateSubmit = (e: React.FormEvent) => { e.preventDefault(); doCreate(); };

  // ===== DRAG-DROP =====
  const handleDragStart = (e: React.DragEvent, cr: any) => {
    if (readOnly) { e.preventDefault(); return; }
    setDragging(cr); e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, j: JourSemaine, h: string) => {
    if (!dragging || isBreakSlot(h)) return;
    // Bloquer si la cible est occupée par un AUTRE créneau
    const targetCr = cellCreneauMap.get(`${j}-${h}`);
    if (targetCr && targetCr.id !== dragging.id) return;
    e.preventDefault(); e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, jour: JourSemaine, heure: string) => {
    e.preventDefault(); if (!dragging) return;
    if (isBreakSlot(heure)) { setError('⏸ Pause.'); setDragging(null); return; }

    // Vérifier que toute la plage cible est libre
    const dur = toMin(dragging.heure_fin) - toMin(dragging.heure_debut);
    const ne = HEURES.find(h => toMin(h) === toMin(heure) + dur) || dragging.heure_fin;
    if (breaksOverlap(heure, ne)) { setError('⏸ Chevaucherait la pause.'); setDragging(null); return; }

    // Vérifier chaque slot de la plage cible
    const startIdx = HEURES.indexOf(heure);
    const endIdx = HEURES.indexOf(ne);
    for (let i = startIdx; i < endIdx; i++) {
      const slot = HEURES[i];
      if (isBreakSlot(slot)) { setError('⏸ Chevaucherait la pause.'); setDragging(null); return; }
      const existing = cellCreneauMap.get(`${jour}-${slot}`);
      if (existing && existing.id !== dragging.id) {
        setError(`⚠ Impossible : ${slot} est déjà occupée par ${existing.matiere_nom}.`);
        setDragging(null);
        return;
      }
    }

    setMoveCreneau(dragging); setMoveTarget({ jour, heure }); setShowMovePopover(true); setDragging(null);
  };

  const handleMoveConfirm = async (moveAll: boolean) => {
    if (!moveCreneau || !moveTarget) return;
    setShowMovePopover(false);
    const dur = toMin(moveCreneau.heure_fin) - toMin(moveCreneau.heure_debut);
    const ne = HEURES.find(h => toMin(h) === toMin(moveTarget.heure) + dur) || moveCreneau.heure_fin;
    if (moveAll) {
      const same = classeCreneaux.filter((c: any) => c.matiere_id === moveCreneau.matiere_id && c.jour === moveCreneau.jour);
      for (const cr of same) {
        const off = toMin(cr.heure_debut) - toMin(moveCreneau.heure_debut);
        const ns = HEURES.find(h => toMin(h) === toMin(moveTarget.heure) + off);
        const nne = HEURES.find(h => toMin(h) === toMin(moveTarget.heure) + off + (toMin(cr.heure_fin) - toMin(cr.heure_debut)));
        if (ns && nne) await updateCreneau(cr.id, { jour: moveTarget.jour, heure_debut: ns, heure_fin: nne });
      }
    } else {
      await updateCreneau(moveCreneau.id, { jour: moveTarget.jour, heure_debut: moveTarget.heure, heure_fin: ne });
    }
    setMoveCreneau(null); setMoveTarget(null);
  };

  // ===== RESIZE =====
  const handleResizeStart = (e: React.MouseEvent, cr: any, edge: 'top' | 'bottom') => {
    e.preventDefault(); e.stopPropagation();
    if (readOnly) return;
    setResizing({ cr, edge }); setResizeHeure(edge === 'top' ? cr.heure_debut : cr.heure_fin);
  };

  const handleResizeEnter = (heure: string) => {
    if (!resizing) return;
    if (isBreakSlot(heure) || isBreakSlot(nextSlot(heure))) return;
    setResizeHeure(resizing.edge === 'bottom' ? nextSlot(heure) : heure);
  };

  const handleResizeEnd = async () => {
    if (!resizing || !resizeHeure) { setResizing(null); return; }
    const { cr, edge } = resizing;
    const newStart = edge === 'top' ? resizeHeure : cr.heure_debut;
    const newEnd = edge === 'bottom' ? resizeHeure : cr.heure_fin;
    setResizing(null); setResizeHeure(null);
    if (newStart === cr.heure_debut && newEnd === cr.heure_fin) return;
    if (toMin(newEnd) <= toMin(newStart)) return;
    if (breaksOverlap(newStart, newEnd)) { setError('⏸ Chevauche la pause.'); return; }
    await updateCreneau(cr.id, { heure_debut: newStart, heure_fin: newEnd });
  };

  // ===== DELETE =====
  const handleDeleteCreneau = async (cr: Creneau) => {
    if (readOnly) return;
    const ok = await confirm({ title: 'Supprimer', message: `Supprimer ${cr.matiere_nom} ?`, confirmText: 'Supprimer', variant: 'danger' });
    if (ok) deleteCreneau(cr.id);
  };

  return (
    <div onMouseUp={() => { if (resizing) handleResizeEnd(); }}>
      <PageHeader title="Planning" subtitle={selectedClasse ? `${selectedClasse.nom}` : 'Sélectionnez une classe'} />
      {error && <Alert variant="warning">{error}</Alert>}

      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '1.5rem' }}>
        {/* SIDEBAR */}
        <div>
          <Card>
            <h3 style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Niveaux</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {niveaux.map(({ niveau, classes: nc }) => (
                <Popover key={niveau} open={openNiveau === niveau} onClose={() => setOpenNiveau(null)}
                  trigger={<div className={`niveau-item ${selectedNiveau === niveau ? 'niveau-item-selected' : openNiveau === niveau ? 'niveau-item-active' : ''}`} onClick={() => setOpenNiveau(openNiveau === niveau ? null : niveau)}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><span>{niveau}</span><Badge label={`${nc.length}`} variant={selectedNiveau === niveau ? 'primary' : 'default'} /></div>
                    <span className="niveau-item-arrow">▾</span>
                  </div>}>
                  <div style={{ padding: '0.35rem 0' }}>
                    {nc.map((c: any) => <ListItem key={c.id} title={c.nom} subtitle={c.salle} selected={c.id === selectedClasseId} onClick={() => handleSelectClasse(c.id)} trailing={<Badge label={`${c._creneauxCount || 0}`} variant={c.id === selectedClasseId ? 'primary' : 'default'} />} />)}
                  </div>
                </Popover>
              ))}
            </div>
            {selectedClasse && <div style={{ marginTop: '1rem', padding: '0.65rem 0.85rem', background: 'var(--primary-light)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--primary)' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--primary)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.2rem' }}>Sélection</div>
              <div style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--primary)' }}>{selectedClasse.nom}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{selectedClasse.niveau} • {selectedClasse.salle}</div>
            </div>}
          </Card>
        </div>

        {/* GRID */}
        <div>
          {!selectedClasseId ? (
            <Card><EmptyState icon={<Icon path={Icons.calendar} size={28} />} message="Sélectionnez une classe" /></Card>
          ) : !selectedClasse ? (
            <Card><EmptyState icon={<Icon path={Icons.warning} size={28} />} message="Classe introuvable" /></Card>
          ) : (
            <>
              <Card style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', flexWrap: 'wrap' }}>
                  <StatItem label="Classe" value={selectedClasse.nom} />
                  <StatItem label="Créneaux" value={classeLoading && !classeData ? '…' : classeCreneaux.length} />
                  <StatItem label="Heures/sem" value={classeLoading && !classeData ? '…' : `${totalHeures}h`} />
                  <StatItem label="Mode" value={<Badge label={selectedClasse.salle_type === 'fixe' ? 'Fixe' : 'Variable'} variant={selectedClasse.salle_type === 'fixe' ? 'info' : 'warning'} />} />
                </div>
              </Card>

              <Card padding="none">
                <div style={{ position: 'relative', overflowX: 'auto' }} onMouseLeave={handleGridMouseLeave}>
                  {classeRefreshing && <div className="planning-table-overlay"><div className="spinner" /><span className="planning-table-overlay-text">Mise à jour…</span></div>}
                  {classeLoading && !classeData ? <div style={{ padding: '2rem' }}><PageLoader /></div> : (
                  <table className="planning-table planning-interactive">
                    <thead><tr><th>Horaire</th>{JOURS.map(j => <th key={j}>{j}</th>)}</tr></thead>
                    <tbody>
                      {HEURES.map(h => {
                        const isBreak = isBreakSlot(h);
                        return (
                          <tr key={h} className={isBreak ? 'planning-break-row' : ''}>
                            <td className={isBreak ? 'planning-break-cell' : ''}>
                              {h}{isBreak && <span className="planning-break-label">pause</span>}
                            </td>
                            {JOURS.map(j => {
                              const cellKey = `${j}-${h}`;
                              const cellCr = cellCreneauMap.get(cellKey);
                              const inSel = isInSelection(j, h);
                              const occupied = !!cellCr;
                              const isEmpty = !occupied && !isBreak;
                              const isStart = cellCr?._isStart;

                              return (
                                <td
                                  key={cellKey}
                                  className={`${isBreak ? 'planning-break-cell' : ''} ${inSel ? 'planning-cell-selected' : ''} ${isEmpty && !readOnly ? 'planning-cell-empty' : ''} ${occupied ? 'planning-cell-occupied' : ''}`}
                                  style={occupied ? { backgroundColor: cellCr.matiere_couleur + '25', borderLeft: `3px solid ${cellCr.matiere_couleur}` } : undefined}
                                  onMouseDown={() => isEmpty && handleCellMouseDown(j, h)}
                                  onMouseEnter={() => { if (selecting) handleCellMouseEnter(j, h); if (resizing) handleResizeEnter(h); }}
                                  onMouseUp={() => { handleCellMouseUp(); if (resizing) handleResizeEnd(); }}
                                  onDragOver={e => handleDragOver(e, j, h)}
                                  onDrop={e => handleDrop(e, j, h)}
                                >
                                  {isBreak && !occupied && <div className="planning-break-indicator">🍽</div>}

                                  {/* Première cellule du créneau : affiche le bloc complet */}
                                  {isStart && cellCr && (
                                    <div className="creneau-block" style={{ backgroundColor: cellCr.matiere_couleur }} draggable={!readOnly} onDragStart={e => handleDragStart(e, cellCr)}>
                                      {!readOnly && <div className="creneau-resize-handle creneau-resize-top" onMouseDown={e => handleResizeStart(e, cellCr, 'top')} />}
                                      <div className="creneau-block-title">{cellCr.matiere_nom}</div>
                                      <div className="creneau-block-time">{cellCr.heure_debut}–{cellCr.heure_fin}</div>
                                      <div className="creneau-block-salle">{cellCr.salle}</div>
                                      {!readOnly && <button type="button" className="creneau-block-delete" onClick={e => { e.stopPropagation(); handleDeleteCreneau(cellCr); }}>✕</button>}
                                    </div>
                                  )}

                                  {/* Cellules suivantes du créneau : juste la couleur, pas de contenu dupliqué */}
                                  {occupied && !isStart && (
                                    <div className="creneau-continuation" style={{ backgroundColor: cellCr.matiere_couleur }}>
                                      {!readOnly && h === HEURES[HEURES.indexOf(cellCr.heure_fin) - 1] && (
                                        <div className="creneau-resize-handle creneau-resize-bottom" onMouseDown={e => handleResizeStart(e, cellCr, 'bottom')} />
                                      )}
                                    </div>
                                  )}


                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  )}
                </div>
              </Card>
            </>
          )}
        </div>
      </div>

      {/* POPUP MULTI-SLOT CREATE */}
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
                  <Button type="submit" variant="primary" disabled={formSubmitting || !formMatiereId || !formSalle} loading={formSubmitting}>Créer</Button>
                </FormActions>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* MOVE POPOVER */}
      {showMovePopover && moveCreneau && moveTarget && (
        <div className="classe-popup-overlay" onClick={() => { setShowMovePopover(false); setMoveCreneau(null); }}>
          <div className="classe-popup" style={{ maxWidth: '400px' }} onClick={e => e.stopPropagation()}>
            <div className="classe-popup-header"><h3>Déplacer</h3><button type="button" className="classe-popup-close" onClick={() => { setShowMovePopover(false); setMoveCreneau(null); }}>✕</button></div>
            <div style={{ padding: '1.25rem' }}>
              <p style={{ fontSize: '0.9rem', marginBottom: '1rem' }}><strong>{moveCreneau.matiere_nom}</strong> → {moveTarget.jour} {moveTarget.heure}</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <Button variant="primary" onClick={() => handleMoveConfirm(false)} fullWidth>Ce créneau uniquement</Button>
                <Button variant="outline" onClick={() => handleMoveConfirm(true)} fullWidth>Tous les {moveCreneau.matiere_nom} ({moveCreneau.jour})</Button>
                <Button variant="secondary" onClick={() => { setShowMovePopover(false); setMoveCreneau(null); }} fullWidth>Annuler</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
