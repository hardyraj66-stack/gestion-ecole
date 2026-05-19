import { JourSemaine } from '../../types';

export interface SalleOccupant {
  classe_nom: string;
  matiere_nom: string;
  heure_debut: string;
  heure_fin: string;
  classe_id?: string;
}

export type { JourSemaine };

export type UndoEntry =
  | { type: 'update'; id: string; before: any; after: any }
  | { type: 'create'; id: string; data: any }
  | { type: 'delete'; id: string; data: any }
  | { type: 'batch'; ops: UndoEntry[] };

export interface ContextMenuState { x: number; y: number; cr: any }
export interface HoverState { cr: any; x: number; y: number }
export interface DragOverState { jour: JourSemaine; heure: string }
export interface MoveTarget { jour: JourSemaine; heure: string }
export interface ResizeState { cr: any; edge: 'top' | 'bottom' }
export interface SelectStart { jour: JourSemaine; heure: string }
