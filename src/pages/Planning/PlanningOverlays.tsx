import { ContextMenuState, HoverState } from './planning.types';

// ─── Context menu ─────────────────────────────────────────────────────────────
interface ContextMenuProps {
  contextMenu: ContextMenuState | null;
  onEdit: (cr: any) => void;
  onDuplicate: (cr: any) => void;
  onDelete: (cr: any) => void;
}

export function PlanningContextMenu({ contextMenu, onEdit, onDuplicate, onDelete }: ContextMenuProps) {
  if (!contextMenu) return null;
  return (
    <div
      className="planning-ctx-menu"
      style={{ top: contextMenu.y, left: contextMenu.x }}
      onClick={e => e.stopPropagation()}
    >
      <button type="button" className="planning-ctx-item" onClick={() => onEdit(contextMenu.cr)}>
        ✏️ Modifier
      </button>
      <button type="button" className="planning-ctx-item" onClick={() => onDuplicate(contextMenu.cr)}>
        📋 Dupliquer
      </button>
      <div className="planning-ctx-separator" />
      <button type="button" className="planning-ctx-item planning-ctx-item-danger" onClick={() => onDelete(contextMenu.cr)}>
        🗑 Supprimer
      </button>
    </div>
  );
}

// ─── Hover tooltip ────────────────────────────────────────────────────────────
interface TooltipProps {
  hoverCr: HoverState | null;
  visible: boolean;
}

export function PlanningTooltip({ hoverCr, visible }: TooltipProps) {
  if (!visible || !hoverCr) return null;
  return (
    <div
      className="planning-tooltip"
      style={{ top: hoverCr.y + 12, left: hoverCr.x + 12 }}
    >
      <div className="planning-tooltip-title" style={{ color: hoverCr.cr.matiere_couleur }}>
        {hoverCr.cr.matiere_nom}
      </div>
      <div className="planning-tooltip-row">🕐 {hoverCr.cr.heure_debut} – {hoverCr.cr.heure_fin}</div>
      <div className="planning-tooltip-row">📍 {hoverCr.cr.salle}</div>
      {hoverCr.cr.enseignant && <div className="planning-tooltip-row">👤 {hoverCr.cr.enseignant}</div>}
      <div className="planning-tooltip-row" style={{ color: 'var(--text-muted)', fontSize: '0.7rem', marginTop: '0.25rem' }}>
        Clic droit pour plus d'options
      </div>
    </div>
  );
}
