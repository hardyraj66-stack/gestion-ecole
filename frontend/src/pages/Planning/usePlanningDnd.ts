import { useState } from 'react';
import { API_BASE_URL } from '../../config/api';
import {
  HEURES, SLOT_MIN,
  toMin, nextSlot, isBreakSlot, breaksOverlap, getCreneauSlots,
} from './planning.helpers';
import { UndoEntry, MoveTarget, DragOverState, JourSemaine } from './planning.types';

interface DndDeps {
  readOnly: boolean;
  selectedClasse: any;
  cellCreneauMap: Map<string, any>;
  dragSlot: string | null;
  dragging: any;
  moveCreneau: any;
  moveTarget: MoveTarget | null;
  moveDragSlot: string | null;
  updateCreneau: (id: string, data: any) => Promise<any>;
  createWithError: (data: any, onOk?: () => void, onErr?: (e: string) => void) => Promise<any>;
  pushUndo: (e: UndoEntry) => void;
  mergeAdjacent: () => Promise<void>;
  showNotification: (msg: string) => void;
  setDragging: (v: any) => void;
  setDragSlot: (v: string | null) => void;
  setDragOver: (v: DragOverState | null) => void;
  setHoverCr: (v: any) => void;
  setShowMovePopover: (v: boolean) => void;
  setMoveCreneau: (v: any) => void;
  setMoveTarget: (v: MoveTarget | null) => void;
  setMoveDragSlot: (v: string | null) => void;
}

export function buildDndHandlers(d: DndDeps) {
  const handleDragStart = (e: React.DragEvent, cr: any, slotHeure: string) => {
    if (d.readOnly) { e.preventDefault(); return; }
    d.setDragging(cr); d.setDragSlot(slotHeure); d.setHoverCr(null);
    e.dataTransfer.effectAllowed = 'move';
    const ghost = document.createElement('div');
    ghost.style.cssText = 'position:fixed;top:-9999px;opacity:0;pointer-events:none';
    document.body.appendChild(ghost);
    e.dataTransfer.setDragImage(ghost, 0, 0);
    setTimeout(() => document.body.removeChild(ghost), 0);
  };

  const handleDragOver = (e: React.DragEvent, j: JourSemaine, h: string) => {
    if (!d.dragging || isBreakSlot(h)) return;
    const targetCr = d.cellCreneauMap.get(`${j}-${h}`);
    if (targetCr && targetCr.id !== d.dragging.id) return;
    e.preventDefault(); e.dataTransfer.dropEffect = 'move';
    d.setDragOver({ jour: j, heure: h });
  };

  const handleDragLeave = () => d.setDragOver(null);

  const handleDragEnd = () => { d.setDragging(null); d.setDragSlot(null); d.setDragOver(null); };

  const handleDrop = async (e: React.DragEvent, jour: JourSemaine, heure: string) => {
    e.preventDefault(); d.setDragOver(null);
    if (!d.dragging) return;
    if (isBreakSlot(heure)) { d.showNotification('⏸ Pause.'); handleDragEnd(); return; }
    if (jour === d.dragging.jour && heure === d.dragging.heure_debut) { handleDragEnd(); return; }

    const dur = toMin(d.dragging.heure_fin) - toMin(d.dragging.heure_debut);
    const ne = HEURES.find(h => toMin(h) === toMin(heure) + dur);
    if (!ne) { d.showNotification('⚠ Déborderait hors des horaires.'); handleDragEnd(); return; }
    if (breaksOverlap(heure, ne)) { d.showNotification('⏸ Chevaucherait la pause.'); handleDragEnd(); return; }

    for (let i = HEURES.indexOf(heure); i < HEURES.indexOf(ne); i++) {
      if (isBreakSlot(HEURES[i])) { d.showNotification('⏸ Chevaucherait la pause.'); handleDragEnd(); return; }
      const existing = d.cellCreneauMap.get(`${jour}-${HEURES[i]}`);
      if (existing && existing.id !== d.dragging.id) { d.showNotification(`⚠ ${HEURES[i]} déjà occupée par ${existing.matiere_nom}.`); handleDragEnd(); return; }
    }

    const isMultiSlot = getCreneauSlots(d.dragging).length > 1;
    if (!isMultiSlot) {
      const before = { jour: d.dragging.jour, heure_debut: d.dragging.heure_debut, heure_fin: d.dragging.heure_fin };
      const after = { jour, heure_debut: heure, heure_fin: ne };
      try {
        await d.updateCreneau(d.dragging.id, after);
        d.pushUndo({ type: 'update', id: d.dragging.id, before, after });
        await d.mergeAdjacent();
      } catch (err: any) {
        d.showNotification(`⚠ ${err?.message || 'Conflit de salle'}`);
      }
      handleDragEnd(); return;
    }

    if (d.dragSlot && jour === d.dragging.jour) {
      const newDebutMin = toMin(heure) - (toMin(d.dragSlot) - toMin(d.dragging.heure_debut));
      if (newDebutMin === toMin(d.dragging.heure_debut)) { handleDragEnd(); return; }
    }

    d.setMoveCreneau(d.dragging); d.setMoveTarget({ jour, heure }); d.setMoveDragSlot(d.dragSlot);
    d.setShowMovePopover(true); handleDragEnd();
  };

  const handleMoveConfirm = async (moveAll: boolean) => {
    if (!d.moveCreneau || !d.moveTarget) return;
    d.setShowMovePopover(false);
    const crSlots = getCreneauSlots(d.moveCreneau);
    const undoOps: UndoEntry[] = [];

    if (moveAll) {
      const grabbedIdx = d.moveDragSlot ? crSlots.indexOf(d.moveDragSlot) : 0;
      const slotsToMove = crSlots.slice(grabbedIdx);
      const slotsBefore = crSlots.slice(0, grabbedIdx);
      if (slotsBefore.length === 0) {
        const dur = toMin(d.moveCreneau.heure_fin) - toMin(d.moveCreneau.heure_debut);
        const ne = HEURES.find(h => toMin(h) === toMin(d.moveTarget!.heure) + dur) || d.moveCreneau.heure_fin;
        const before = { jour: d.moveCreneau.jour, heure_debut: d.moveCreneau.heure_debut, heure_fin: d.moveCreneau.heure_fin };
        const after = { jour: d.moveTarget!.jour, heure_debut: d.moveTarget!.heure, heure_fin: ne };
        try { await d.updateCreneau(d.moveCreneau.id, after); undoOps.push({ type: 'update', id: d.moveCreneau.id, before, after }); }
        catch (err: any) { d.showNotification(`⚠ ${err?.message || 'Conflit de salle'}`); d.setMoveCreneau(null); d.setMoveTarget(null); d.setMoveDragSlot(null); return; }
      } else {
        const newOrigEnd = nextSlot(slotsBefore[slotsBefore.length - 1]);
        const before = { jour: d.moveCreneau.jour, heure_debut: d.moveCreneau.heure_debut, heure_fin: d.moveCreneau.heure_fin };
        const after = { heure_debut: slotsBefore[0], heure_fin: newOrigEnd };
        try { await d.updateCreneau(d.moveCreneau.id, after); undoOps.push({ type: 'update', id: d.moveCreneau.id, before, after }); }
        catch (err: any) { d.showNotification(`⚠ ${err?.message || 'Conflit de salle'}`); d.setMoveCreneau(null); d.setMoveTarget(null); d.setMoveDragSlot(null); return; }
        const newEnd = HEURES.find(h => toMin(h) === toMin(d.moveTarget!.heure) + slotsToMove.length * SLOT_MIN) || d.moveTarget!.heure;
        await d.createWithError({ classe_id: d.moveCreneau.classe_id, matiere_id: d.moveCreneau.matiere_id, matiere_nom: d.moveCreneau.matiere_nom, matiere_couleur: d.moveCreneau.matiere_couleur, jour: d.moveTarget!.jour, heure_debut: d.moveTarget!.heure, heure_fin: newEnd, salle: d.moveCreneau.salle, enseignant: d.moveCreneau.enseignant || '' }, undefined, (err) => d.showNotification(`⚠ ${err}`));
      }
    } else {
      const grabbedIdx = d.moveDragSlot ? crSlots.indexOf(d.moveDragSlot) : 0;
      const slotsBefore = crSlots.slice(0, grabbedIdx);
      const slotsAfter = crSlots.slice(grabbedIdx + 1);
      const newEnd = HEURES[HEURES.indexOf(d.moveTarget!.heure) + 1] || d.moveTarget!.heure;
      const before = { jour: d.moveCreneau.jour, heure_debut: d.moveCreneau.heure_debut, heure_fin: d.moveCreneau.heure_fin };
      const after = { jour: d.moveTarget!.jour, heure_debut: d.moveTarget!.heure, heure_fin: newEnd };
      try { await d.updateCreneau(d.moveCreneau.id, after); undoOps.push({ type: 'update', id: d.moveCreneau.id, before, after }); }
      catch (err: any) { d.showNotification(`⚠ ${err?.message || 'Conflit de salle'}`); d.setMoveCreneau(null); d.setMoveTarget(null); d.setMoveDragSlot(null); return; }
      const base = { classe_id: d.moveCreneau.classe_id, matiere_id: d.moveCreneau.matiere_id, matiere_nom: d.moveCreneau.matiere_nom, matiere_couleur: d.moveCreneau.matiere_couleur, jour: d.moveCreneau.jour, salle: d.moveCreneau.salle, enseignant: d.moveCreneau.enseignant || '' };
      if (slotsBefore.length > 0) await d.createWithError({ ...base, heure_debut: slotsBefore[0], heure_fin: nextSlot(slotsBefore[slotsBefore.length - 1]) }, undefined, (err) => d.showNotification(`⚠ ${err}`));
      if (slotsAfter.length > 0) await d.createWithError({ ...base, heure_debut: slotsAfter[0], heure_fin: nextSlot(slotsAfter[slotsAfter.length - 1]) }, undefined, (err) => d.showNotification(`⚠ ${err}`));
    }

    if (undoOps.length === 1) d.pushUndo(undoOps[0]);
    else if (undoOps.length > 1) d.pushUndo({ type: 'batch', ops: undoOps });
    await d.mergeAdjacent();
    d.setMoveCreneau(null); d.setMoveTarget(null); d.setMoveDragSlot(null);
  };

  return { handleDragStart, handleDragOver, handleDragLeave, handleDragEnd, handleDrop, handleMoveConfirm };
}

// ─── DnD state slice (used by usePlanningState) ───────────────────────────────
export function useDndState() {
  const [dragging, setDragging] = useState<any>(null);
  const [dragSlot, setDragSlot] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<DragOverState | null>(null);
  const [showMovePopover, setShowMovePopover] = useState(false);
  const [moveTarget, setMoveTarget] = useState<MoveTarget | null>(null);
  const [moveCreneau, setMoveCreneau] = useState<any>(null);
  const [moveDragSlot, setMoveDragSlot] = useState<string | null>(null);
  return {
    dragging, setDragging, dragSlot, setDragSlot, dragOver, setDragOver,
    showMovePopover, setShowMovePopover, moveTarget, setMoveTarget,
    moveCreneau, setMoveCreneau, moveDragSlot, setMoveDragSlot,
  };
}

// ─── Undo/redo helpers ────────────────────────────────────────────────────────
export async function applyUndoEntry(
  entry: UndoEntry,
  isUndo: boolean,
  setUndoStack: React.Dispatch<React.SetStateAction<UndoEntry[]>>,
  setRedoStack: React.Dispatch<React.SetStateAction<UndoEntry[]>>,
) {
  if (entry.type === 'update') {
    const data = isUndo ? entry.before : entry.after;
    await fetch(`${API_BASE_URL}/planning/${entry.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    if (isUndo) setRedoStack(s => [...s, entry]); else setUndoStack(s => [...s, entry]);
  } else if (entry.type === 'create') {
    if (isUndo) { await fetch(`${API_BASE_URL}/planning/${entry.id}`, { method: 'DELETE' }); setRedoStack(s => [...s, entry]); }
    else { await fetch(`${API_BASE_URL}/planning`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(entry.data) }); setUndoStack(s => [...s, entry]); }
  } else if (entry.type === 'delete') {
    if (isUndo) { await fetch(`${API_BASE_URL}/planning`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(entry.data) }); setRedoStack(s => [...s, entry]); }
    else { await fetch(`${API_BASE_URL}/planning/${entry.id}`, { method: 'DELETE' }); setUndoStack(s => [...s, entry]); }
  } else if (entry.type === 'batch') {
    const ops = isUndo ? [...entry.ops].reverse() : entry.ops;
    for (const op of ops) await applyUndoEntry(op, isUndo, setUndoStack, setRedoStack);
  }
}
