import { generatePlanningHours } from '../../utils/helpers';
import { JourSemaine } from '../../types';

export const JOURS: JourSemaine[] = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
export const HEURES = generatePlanningHours();
export const NIVEAUX_ORDRE = ['CP','CE1','CE2','CM1','CM2','6ème','5ème','4ème','3ème','2nde','1ère','Terminale'];
export const SLOT_MIN = 30;

export function toMin(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

export function nextSlot(h: string): string {
  const i = HEURES.indexOf(h);
  return i < HEURES.length - 1 ? HEURES[i + 1] : h;
}

export const isBreakSlot = (h: string) => h === '12:00' || h === '12:30';
export const breaksOverlap = (s: string, e: string) => toMin(s) < toMin('12:30') && toMin(e) > toMin('12:00');

export function isOccupied(jour: JourSemaine, heure: string, creneaux: any[]): boolean {
  const m = toMin(heure);
  return creneaux.some(c => c.jour === jour && toMin(c.heure_debut) <= m && toMin(c.heure_fin) > m);
}

export function getCreneauSlots(cr: any): string[] {
  const si = HEURES.indexOf(cr.heure_debut);
  const ei = HEURES.indexOf(cr.heure_fin);
  if (si === -1) return [];
  return HEURES.slice(si, ei > si ? ei : si + 1);
}

export function hexToRgb(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r},${g},${b}`;
}

export function buildCellCreneauMap(creneaux: any[]): Map<string, any> {
  const map = new Map<string, any>();
  for (const cr of creneaux) {
    const si = HEURES.indexOf(cr.heure_debut);
    const ei = HEURES.findIndex(h => h === cr.heure_fin);
    const end = ei > si ? ei : si + 1;
    for (let i = si; i < end; i++) {
      map.set(`${cr.jour}-${HEURES[i]}`, {
        ...cr,
        _isStart: i === si,
        _slotIndex: i - si,
        _totalSlots: end - si,
        _isEnd: i === end - 1,
      });
    }
  }
  return map;
}

export function buildGhostCells(dragging: any, dragOverHeure: string, dragOverJour: JourSemaine): Set<string> {
  const cells = new Set<string>();
  const slots = getCreneauSlots(dragging);
  const targetIdx = HEURES.indexOf(dragOverHeure);
  for (let i = 0; i < slots.length; i++) {
    const h = HEURES[targetIdx + i];
    if (h) cells.add(`${dragOverJour}-${h}`);
  }
  return cells;
}
