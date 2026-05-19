import { PageLoader } from '../../components/ui/PageLoader';
import { JourSemaine } from '../../types';
import { JOURS, HEURES, isBreakSlot, hexToRgb } from './planning.helpers';

interface Props {
  readOnly: boolean;
  classeLoading: boolean;
  classeData: any;
  classeRefreshing: boolean;
  cellCreneauMap: Map<string, any>;
  ghostCells: Set<string>;
  ghostConflict: boolean;
  dragging: any;
  selecting: boolean;
  resizing: any;
  resizeHeure: string | null;
  isInSelection: (j: JourSemaine, h: string) => boolean;
  onCellMouseDown: (j: JourSemaine, h: string) => void;
  onCellMouseEnter: (j: JourSemaine, h: string) => void;
  onCellMouseUp: () => void;
  onMouseLeave: () => void;
  onDragOver: (e: React.DragEvent, j: JourSemaine, h: string) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent, j: JourSemaine, h: string) => void;
  onDragStart: (e: React.DragEvent, cr: any, h: string) => void;
  onDragEnd: () => void;
  onResizeStart: (e: React.MouseEvent, cr: any, edge: 'top' | 'bottom') => void;
  onResizeEnter: (h: string) => void;
  onResizeEnd: () => void;
  onOpenEdit: (cr: any, e: React.MouseEvent) => void;
  onDelete: (cr: any) => void;
  onContextMenu: (e: React.MouseEvent, cr: any) => void;
  onCreneauMouseEnter: (e: React.MouseEvent, cr: any) => void;
  onCreneauMouseLeave: () => void;
}

export function PlanningGrid({
  readOnly, classeLoading, classeData, classeRefreshing,
  cellCreneauMap, ghostCells, ghostConflict, dragging, selecting,
  resizing, resizeHeure, isInSelection,
  onCellMouseDown, onCellMouseEnter, onCellMouseUp, onMouseLeave,
  onDragOver, onDragLeave, onDrop, onDragStart, onDragEnd,
  onResizeStart, onResizeEnter, onResizeEnd,
  onOpenEdit, onDelete, onContextMenu, onCreneauMouseEnter, onCreneauMouseLeave,
}: Props) {

  const isGhost = (j: JourSemaine, h: string) => ghostCells.has(`${j}-${h}`);

  return (
    <div
      className="planning-grid-wrap"
      onMouseLeave={onMouseLeave}
      onMouseUp={() => { if (resizing) onResizeEnd(); }}
    >
      {classeRefreshing && (
        <div className="planning-table-overlay">
          <div className="spinner" />
          <span className="planning-table-overlay-text">Mise à jour…</span>
        </div>
      )}

      {classeLoading && !classeData ? (
        <div style={{ padding: '2rem' }}><PageLoader /></div>
      ) : (
        <table className="planning-table planning-interactive">
          <thead>
            <tr>
              <th className="planning-th-time">Horaire</th>
              {JOURS.map(j => <th key={j} className="planning-th-day">{j}</th>)}
            </tr>
          </thead>
          <tbody>
            {HEURES.map(h => {
              const isBreak = isBreakSlot(h);
              return (
                <tr key={h} className={isBreak ? 'planning-break-row' : 'planning-row'}>
                  <td className={`planning-time-cell${isBreak ? ' planning-break-cell' : ''}`}>
                    <span className="planning-time-label">{h}</span>
                    {isBreak && <span className="planning-break-label">pause</span>}
                  </td>
                  {JOURS.map(j => (
                    <PlanningCell
                      key={`${j}-${h}`}
                      jour={j} heure={h}
                      cellCr={cellCreneauMap.get(`${j}-${h}`)}
                      isBreak={isBreak}
                      inSel={isInSelection(j, h)}
                      ghost={isGhost(j, h)}
                      ghostConflict={ghostConflict}
                      dragging={dragging}
                      selecting={selecting}
                      readOnly={readOnly}
                      resizing={resizing}
                      resizeHeure={resizeHeure}
                      onMouseDown={() => onCellMouseDown(j, h)}
                      onMouseEnter={() => { if (selecting) onCellMouseEnter(j, h); if (resizing) onResizeEnter(h); }}
                      onMouseUp={() => { onCellMouseUp(); if (resizing) onResizeEnd(); }}
                      onDragOver={e => onDragOver(e, j, h)}
                      onDragLeave={onDragLeave}
                      onDrop={e => onDrop(e, j, h)}
                      onDragStart={onDragStart}
                      onDragEnd={onDragEnd}
                      onResizeStart={onResizeStart}
                      onOpenEdit={onOpenEdit}
                      onDelete={onDelete}
                      onContextMenu={onContextMenu}
                      onCreneauMouseEnter={onCreneauMouseEnter}
                      onCreneauMouseLeave={onCreneauMouseLeave}
                    />
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}

// ─── Single cell ─────────────────────────────────────────────────────────────
interface CellProps {
  jour: JourSemaine; heure: string;
  cellCr: any;
  isBreak: boolean; inSel: boolean; ghost: boolean; ghostConflict: boolean;
  dragging: any; selecting: boolean; readOnly: boolean;
  resizing: any; resizeHeure: string | null;
  onMouseDown: () => void; onMouseEnter: () => void; onMouseUp: () => void;
  onDragOver: (e: React.DragEvent) => void; onDragLeave: () => void; onDrop: (e: React.DragEvent) => void;
  onDragStart: (e: React.DragEvent, cr: any, h: string) => void; onDragEnd: () => void;
  onResizeStart: (e: React.MouseEvent, cr: any, edge: 'top' | 'bottom') => void;
  onOpenEdit: (cr: any, e: React.MouseEvent) => void; onDelete: (cr: any) => void;
  onContextMenu: (e: React.MouseEvent, cr: any) => void;
  onCreneauMouseEnter: (e: React.MouseEvent, cr: any) => void; onCreneauMouseLeave: () => void;
}

function PlanningCell({ jour: _j, heure: h, cellCr, isBreak, inSel, ghost, ghostConflict, dragging, selecting, readOnly, resizing, resizeHeure, onMouseDown, onMouseEnter, onMouseUp, onDragOver, onDragLeave, onDrop, onDragStart, onDragEnd, onResizeStart, onOpenEdit, onDelete, onContextMenu, onCreneauMouseEnter, onCreneauMouseLeave }: CellProps) {
  const occupied = !!cellCr;
  const isEmpty = !occupied && !isBreak;
  const isStart = cellCr?._isStart;
  const isEnd = cellCr?._isEnd;
  const resizingThis = resizing && resizing.cr.id === cellCr?.id;

  const cls = [
    'planning-cell',
    isBreak ? 'planning-break-cell' : '',
    inSel ? 'planning-cell-selected' : '',
    isEmpty && !readOnly ? 'planning-cell-empty' : '',
    occupied ? 'planning-cell-occupied' : '',
    ghost ? (ghostConflict ? 'planning-cell-ghost-conflict' : 'planning-cell-ghost') : '',
  ].filter(Boolean).join(' ');

  return (
    <td
      className={cls}
      onMouseDown={() => isEmpty && onMouseDown()}
      onMouseEnter={onMouseEnter}
      onMouseUp={onMouseUp}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      {isBreak && !occupied && <div className="planning-break-indicator">☕</div>}

      {isStart && cellCr && (
        <div
          className={`pcb${dragging?.id === cellCr.id ? ' pcb-dragging' : ''}`}
          style={{ '--cr-color': cellCr.matiere_couleur, '--cr-rgb': hexToRgb(cellCr.matiere_couleur), borderRadius: isEnd ? '8px' : '8px 8px 0 0' } as any}
          draggable={!readOnly}
          onDragStart={e => onDragStart(e, cellCr, h)}
          onDragEnd={onDragEnd}
          onClick={e => onOpenEdit(cellCr, e)}
          onContextMenu={e => onContextMenu(e, cellCr)}
          onMouseEnter={e => onCreneauMouseEnter(e, cellCr)}
          onMouseLeave={onCreneauMouseLeave}
        >
          {!readOnly && <div className="pcb-resize-handle pcb-resize-top" onMouseDown={e => onResizeStart(e, cellCr, 'top')} />}
          <div className="pcb-color-bar" style={{ background: cellCr.matiere_couleur }} />
          <div className="pcb-content">
            <div className="pcb-title">{cellCr.matiere_nom}</div>
            <div className="pcb-meta">{cellCr.heure_debut}–{cellCr.heure_fin}</div>
            {cellCr.salle && <div className="pcb-meta">📍 {cellCr.salle}</div>}
            {cellCr.enseignant && <div className="pcb-meta pcb-teacher">👤 {cellCr.enseignant}</div>}
          </div>
          {!readOnly && <button type="button" className="pcb-delete" onClick={e => { e.stopPropagation(); onDelete(cellCr); }}>✕</button>}
          {!readOnly && isEnd && <div className="pcb-resize-handle pcb-resize-bottom" onMouseDown={e => onResizeStart(e, cellCr, 'bottom')} />}
        </div>
      )}

      {occupied && !isStart && (
        <div
          className={`pcb-cont${dragging?.id === cellCr.id ? ' pcb-dragging' : ''}${isEnd ? ' pcb-cont-end' : ''}`}
          style={{ '--cr-color': cellCr.matiere_couleur, '--cr-rgb': hexToRgb(cellCr.matiere_couleur) } as any}
          draggable={!readOnly}
          onDragStart={e => onDragStart(e, cellCr, h)}
          onDragEnd={onDragEnd}
          onContextMenu={e => onContextMenu(e, cellCr)}
          onMouseEnter={e => onCreneauMouseEnter(e, cellCr)}
          onMouseLeave={onCreneauMouseLeave}
        >
          {!readOnly && isEnd && <div className="pcb-resize-handle pcb-resize-bottom" onMouseDown={e => onResizeStart(e, cellCr, 'bottom')} />}
          {resizingThis && resizeHeure && <div className="pcb-resize-preview">{resizeHeure}</div>}
        </div>
      )}

      {isEmpty && !readOnly && !dragging && !selecting && (
        <div className="planning-cell-add-hint">+</div>
      )}
    </td>
  );
}
