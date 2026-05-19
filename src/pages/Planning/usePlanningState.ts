import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { usePlanning } from '../../contexts/PlanningContext';
import { useConfirm } from '../../components/shared/ConfirmDialog';
import { API_BASE_URL } from '../../config/api';
import { Creneau } from '../../types';
import {
  HEURES,
  toMin, nextSlot, isBreakSlot, breaksOverlap,
  isOccupied, buildCellCreneauMap, buildGhostCells,
} from './planning.helpers';
import { UndoEntry, ContextMenuState, HoverState, ResizeState, SelectStart, JourSemaine, SalleOccupant } from './planning.types';
import { useDndState, buildDndHandlers, applyUndoEntry } from './usePlanningDnd';

// ─── Notification hook ───────────────────────────────────────────────────────
export function useNotification(duration = 6000) {
  const [msg, setMsg] = useState('');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const show = useCallback((m: string) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setMsg(m);
    timerRef.current = setTimeout(() => setMsg(''), duration);
  }, [duration]);
  const clear = useCallback(() => { if (timerRef.current) clearTimeout(timerRef.current); setMsg(''); }, []);
  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);
  return { msg, show, clear };
}

// ─── Main planning state hook ────────────────────────────────────────────────
export function usePlanningState(
  classeCreneaux: any[],
  allMatieres: any[],
  selectedClasse: any,
  readOnly: boolean,
) {
  const { createWithError, update: updateCreneau, delete: deleteCreneau } = usePlanning();
  const confirm = useConfirm();
  const notification = useNotification(6000);

  // ── Selection ──
  const [selecting, setSelecting] = useState(false);
  const [selStart, setSelStart] = useState<SelectStart | null>(null);
  const [selEnd, setSelEnd] = useState<string | null>(null);

  // ── Create form ──
  const [showCreatePopup, setShowCreatePopup] = useState(false);
  const [formJour, setFormJour] = useState<JourSemaine>('Lundi');
  const [formDebut, setFormDebut] = useState('08:00');
  const [formFin, setFormFin] = useState('09:00');
  const [formMatiereId, setFormMatiereId] = useState('');
  const [formSalle, setFormSalle] = useState('');
  const [formEnseignant, setFormEnseignant] = useState('');
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSalleConflict, setFormSalleConflict] = useState<SalleOccupant | null>(null);

  // ── Edit form ──
  const [showEditPopup, setShowEditPopup] = useState(false);
  const [editCreneau, setEditCreneau] = useState<any>(null);
  const [editMatiereId, setEditMatiereId] = useState('');
  const [editJour, setEditJour] = useState<JourSemaine>('Lundi');
  const [editDebut, setEditDebut] = useState('');
  const [editFin, setEditFin] = useState('');
  const [editSalle, setEditSalle] = useState('');
  const [editEnseignant, setEditEnseignant] = useState('');
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState('');
  const [editSalleConflict, setEditSalleConflict] = useState<SalleOccupant | null>(null);

  // ── Resize ──
  const [resizing, setResizing] = useState<ResizeState | null>(null);
  const [resizeHeure, setResizeHeure] = useState<string | null>(null);

  // ── UI overlays ──
  const [hoverCr, setHoverCr] = useState<HoverState | null>(null);
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Undo/Redo ──
  const [undoStack, setUndoStack] = useState<UndoEntry[]>([]);
  const [redoStack, setRedoStack] = useState<UndoEntry[]>([]);

  // ── Drag & drop state ──
  const dnd = useDndState();

  // ── Computed ──
  const cellCreneauMap = useMemo(() => buildCellCreneauMap(classeCreneaux), [classeCreneaux]);

  const ghostCells = useMemo(() => {
    if (!dnd.dragging || !dnd.dragOver) return new Set<string>();
    return buildGhostCells(dnd.dragging, dnd.dragOver.heure, dnd.dragOver.jour);
  }, [dnd.dragging, dnd.dragOver]);

  const ghostConflict = useMemo(() => {
    if (!ghostCells.size) return false;
    for (const key of ghostCells) {
      const existing = cellCreneauMap.get(key);
      if (existing && existing.id !== dnd.dragging?.id) return true;
      const h = key.split('-').slice(1).join('-');
      if (isBreakSlot(h)) return true;
    }
    return false;
  }, [ghostCells, cellCreneauMap, dnd.dragging]);

  // Close context menu on outside click
  useEffect(() => {
    if (!contextMenu) return;
    const close = () => setContextMenu(null);
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, [contextMenu]);

  // ─── Check salle dispo (utilisé avant ouverture des modals) ──────────────
  const checkSalleConflict = useCallback(async (salle: string, jour: string, hd: string, hf: string, excludeId?: string): Promise<SalleOccupant | null> => {
    if (!salle) return null;
    try {
      const params = new URLSearchParams({ jour, heure_debut: hd, heure_fin: hf });
      if (excludeId) params.set('excludeCreneauId', excludeId);
      const res = await fetch(`${API_BASE_URL}/salles/disponibles?${params}`);
      if (!res.ok) return null;
      const salles: any[] = await res.json();
      const found = salles.find((s: any) => s.nom === salle);
      if (!found || found.disponible) return null;
      return found.occupant ?? { matiere_nom: '?', heure_debut: hd, heure_fin: hf };
    } catch { return null; }
  }, []);

  // ─── Merge adjacent (backend) ─────────────────────────────────────────────
  const mergeAdjacent = async () => {
    if (!selectedClasse) return;
    try { await fetch(`${API_BASE_URL}/planning/merge/${selectedClasse.id}`, { method: 'POST' }); } catch { /* silencieux */ }
  };

  // ─── Undo/Redo ────────────────────────────────────────────────────────────
  const pushUndo = useCallback((entry: UndoEntry) => {
    setUndoStack(s => [...s.slice(-49), entry]);
    setRedoStack([]);
  }, []);

  const handleUndo = useCallback(async () => {
    setUndoStack(s => {
      if (!s.length) return s;
      const entry = s[s.length - 1];
      applyUndoEntry(entry, true, setUndoStack, setRedoStack);
      return s.slice(0, -1);
    });
  }, []);

  const handleRedo = useCallback(async () => {
    setRedoStack(s => {
      if (!s.length) return s;
      const entry = s[s.length - 1];
      applyUndoEntry(entry, false, setUndoStack, setRedoStack);
      return s.slice(0, -1);
    });
  }, []);

  // ─── Selection ────────────────────────────────────────────────────────────
  const isInSelection = (jour: JourSemaine, heure: string) => {
    if (!selStart || !selEnd || selStart.jour !== jour) return false;
    const si = HEURES.indexOf(selStart.heure), ei = HEURES.indexOf(selEnd), ci = HEURES.indexOf(heure);
    return ci >= Math.min(si, ei) && ci <= Math.max(si, ei);
  };

  const handleCellMouseDown = (jour: JourSemaine, heure: string) => {
    if (readOnly || !selectedClasse) return;
    if (isBreakSlot(heure)) { notification.show('⏸ Plage réservée à la pause.'); return; }
    if (isOccupied(jour, heure, classeCreneaux)) return;
    setSelecting(true); setSelStart({ jour, heure }); setSelEnd(heure); notification.clear();
  };

  const handleCellMouseEnter = (jour: JourSemaine, heure: string) => {
    if (!selecting || !selStart || selStart.jour !== jour) return;
    if (isBreakSlot(heure) || isOccupied(jour, heure, classeCreneaux)) return;
    setSelEnd(heure);
  };

  const handleCellMouseUp = async () => {
    if (!selecting || !selStart || !selEnd) { setSelecting(false); return; }
    setSelecting(false);
    const si = HEURES.indexOf(selStart.heure), ei = HEURES.indexOf(selEnd);
    const startH = HEURES[Math.min(si, ei)];
    const endH = nextSlot(HEURES[Math.max(si, ei)]);
    if (breaksOverlap(startH, endH)) { notification.show('⏸ Chevauche la pause.'); setSelStart(null); setSelEnd(null); return; }
    const salle = selectedClasse?.salle || '';
    setFormJour(selStart.jour); setFormDebut(startH); setFormFin(endH);
    setFormSalle(salle); setFormMatiereId(''); setFormEnseignant(''); setFormError('');
    const conflict = await checkSalleConflict(salle, selStart.jour, startH, endH);
    setFormSalleConflict(conflict);
    setShowCreatePopup(true);
    setSelStart(null); setSelEnd(null);
  };

  const handleGridMouseLeave = () => { if (selecting) { setSelecting(false); setSelStart(null); setSelEnd(null); } };

  // ─── Create ───────────────────────────────────────────────────────────────
  const doCreate = async () => {
    if (!formMatiereId || !formSalle || !selectedClasse) return;
    if (breaksOverlap(formDebut, formFin)) { setFormError('Chevauche la pause.'); return; }
    const mat = allMatieres.find((m: any) => m.id === formMatiereId);
    if (!mat) return;
    setFormSubmitting(true); setFormError('');
    await createWithError(
      { classe_id: selectedClasse.id, matiere_id: formMatiereId, matiere_nom: mat.nom, matiere_couleur: mat.couleur || '#2563eb', jour: formJour, heure_debut: formDebut, heure_fin: formFin, salle: formSalle, enseignant: formEnseignant.trim() },
      () => setShowCreatePopup(false),
      (err) => setFormError(err),
    );
    setFormSubmitting(false);
  };

  // ─── Edit ─────────────────────────────────────────────────────────────────
  const handleOpenEdit = async (cr: any, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (readOnly) return;
    setEditCreneau(cr); setEditMatiereId(cr.matiere_id); setEditJour(cr.jour);
    setEditDebut(cr.heure_debut); setEditFin(cr.heure_fin);
    setEditSalle(cr.salle || ''); setEditEnseignant(cr.enseignant || '');
    setEditError(''); setContextMenu(null);
    const conflict = await checkSalleConflict(cr.salle || '', cr.jour, cr.heure_debut, cr.heure_fin, cr.id);
    setEditSalleConflict(conflict);
    setShowEditPopup(true);
  };

  const doEdit = async () => {
    if (!editCreneau || !editMatiereId || !editSalle) return;
    if (breaksOverlap(editDebut, editFin)) { setEditError('Chevauche la pause.'); return; }
    if (toMin(editFin) <= toMin(editDebut)) { setEditError('La fin doit être après le début.'); return; }
    const mat = allMatieres.find((m: any) => m.id === editMatiereId);
    setEditSubmitting(true); setEditError('');
    try {
      const before = { matiere_id: editCreneau.matiere_id, jour: editCreneau.jour, heure_debut: editCreneau.heure_debut, heure_fin: editCreneau.heure_fin, salle: editCreneau.salle, enseignant: editCreneau.enseignant };
      const payload: any = { jour: editJour, heure_debut: editDebut, heure_fin: editFin, salle: editSalle, enseignant: editEnseignant.trim() };
      if (mat) { payload.matiere_id = editMatiereId; payload.matiere_nom = mat.nom; payload.matiere_couleur = mat.couleur || '#2563eb'; }
      await updateCreneau(editCreneau.id, payload);
      pushUndo({ type: 'update', id: editCreneau.id, before, after: payload });
      setShowEditPopup(false);
    } catch { setEditError('Erreur lors de la modification.'); }
    setEditSubmitting(false);
  };

  // ─── Duplicate ────────────────────────────────────────────────────────────
  const handleDuplicate = async (cr: any) => {
    if (readOnly || !selectedClasse) return;
    setContextMenu(null);
    notification.show('Duplication en cours…');
    await createWithError(
      { classe_id: cr.classe_id, matiere_id: cr.matiere_id, matiere_nom: cr.matiere_nom, matiere_couleur: cr.matiere_couleur, jour: cr.jour, heure_debut: cr.heure_debut, heure_fin: cr.heure_fin, salle: cr.salle, enseignant: cr.enseignant || '' },
      () => notification.show('✓ Créneau dupliqué'),
      (err) => notification.show(`⚠ ${err}`),
    );
  };

  // ─── Delete ───────────────────────────────────────────────────────────────
  const handleDeleteCreneau = async (cr: Creneau) => {
    if (readOnly) return;
    setContextMenu(null);
    const ok = await confirm({ title: 'Supprimer', message: `Supprimer le créneau ${cr.matiere_nom} ?`, confirmText: 'Supprimer', variant: 'danger' });
    if (!ok) return;
    await deleteCreneau(cr.id);
    pushUndo({ type: 'delete', id: cr.id, data: cr });
  };

  // ─── Context menu ─────────────────────────────────────────────────────────
  const handleContextMenu = (e: React.MouseEvent, cr: any) => {
    e.preventDefault(); e.stopPropagation();
    if (readOnly) return;
    setContextMenu({ x: e.clientX, y: e.clientY, cr }); setHoverCr(null);
  };

  // ─── Hover tooltip ────────────────────────────────────────────────────────
  const handleCreneauMouseEnter = (e: React.MouseEvent, cr: any) => {
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    hoverTimerRef.current = setTimeout(() => setHoverCr({ cr, x: e.clientX, y: e.clientY }), 600);
  };
  const handleCreneauMouseLeave = () => {
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    setHoverCr(null);
  };

  // ─── Drag & drop (delegated to usePlanningDnd) ────────────────────────────
  const dndHandlers = buildDndHandlers({
    readOnly, selectedClasse, cellCreneauMap,
    dragSlot: dnd.dragSlot, dragging: dnd.dragging,
    moveCreneau: dnd.moveCreneau, moveTarget: dnd.moveTarget, moveDragSlot: dnd.moveDragSlot,
    updateCreneau, createWithError, pushUndo, mergeAdjacent,
    showNotification: notification.show,
    setDragging: dnd.setDragging, setDragSlot: dnd.setDragSlot, setDragOver: dnd.setDragOver,
    setHoverCr, setShowMovePopover: dnd.setShowMovePopover,
    setMoveCreneau: dnd.setMoveCreneau, setMoveTarget: dnd.setMoveTarget, setMoveDragSlot: dnd.setMoveDragSlot,
  });

  // ─── Resize ───────────────────────────────────────────────────────────────
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
    if (breaksOverlap(newStart, newEnd)) { notification.show('⏸ Chevauche la pause.'); return; }
    const before = { heure_debut: cr.heure_debut, heure_fin: cr.heure_fin };
    const after = { heure_debut: newStart, heure_fin: newEnd };
    try {
      await updateCreneau(cr.id, after);
      pushUndo({ type: 'update', id: cr.id, before, after });
      await mergeAdjacent();
    } catch (err: any) {
      notification.show(`⚠ ${err?.message || 'Conflit de salle'}`);
    }
  };

  return {
    // Selection
    selecting, selStart, selEnd,
    isInSelection, handleCellMouseDown, handleCellMouseEnter, handleCellMouseUp, handleGridMouseLeave,
    // Create
    showCreatePopup, setShowCreatePopup,
    formJour, setFormJour, formDebut, setFormDebut, formFin, setFormFin,
    formMatiereId, setFormMatiereId, formSalle, setFormSalle,
    formEnseignant, setFormEnseignant, formSubmitting, formError, doCreate,
    formSalleConflict, setFormSalleConflict,
    // Edit
    showEditPopup, setShowEditPopup, editCreneau,
    editMatiereId, setEditMatiereId, editJour, setEditJour,
    editDebut, setEditDebut, editFin, setEditFin,
    editSalle, setEditSalle, editEnseignant, setEditEnseignant,
    editSubmitting, editError, doEdit,
    editSalleConflict, setEditSalleConflict,
    handleOpenEdit,
    // Actions
    handleDuplicate, handleDeleteCreneau,
    // Drag & drop
    dragging: dnd.dragging, dragSlot: dnd.dragSlot, ghostCells, ghostConflict,
    ...dndHandlers,
    showMovePopover: dnd.showMovePopover, setShowMovePopover: dnd.setShowMovePopover,
    moveTarget: dnd.moveTarget, moveCreneau: dnd.moveCreneau, setMoveCreneau: dnd.setMoveCreneau,
    moveDragSlot: dnd.moveDragSlot,
    // Resize
    resizing, resizeHeure, handleResizeStart, handleResizeEnter, handleResizeEnd,
    // UI overlays
    hoverCr, contextMenu, setContextMenu,
    handleContextMenu, handleCreneauMouseEnter, handleCreneauMouseLeave,
    // Undo/Redo
    undoStack, redoStack, handleUndo, handleRedo,
    // Notification
    notification,
    // Computed
    cellCreneauMap,
  };
}

