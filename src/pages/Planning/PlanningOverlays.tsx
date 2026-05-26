import { useTranslation } from 'react-i18next';
import { ContextMenuState, HoverState } from './planning.types';

// ─── Context menu ─────────────────────────────────────────────────────────────
interface ContextMenuProps {
  contextMenu: ContextMenuState | null;
  onEdit: (cr: any) => void;
  onDuplicate: (cr: any) => void;
  onDelete: (cr: any) => void;
}

export function PlanningContextMenu({ contextMenu, onEdit, onDuplicate, onDelete }: ContextMenuProps) {
  const { t } = useTranslation();
  if (!contextMenu) return null;
  return (
    <div
      className="planning-ctx-menu"
      style={{ top: contextMenu.y, left: contextMenu.x }}
      onClick={e => e.stopPropagation()}
    >
      <button type="button" className="planning-ctx-item" onClick={() => onEdit(contextMenu.cr)}>
        {t('planning.ctx.modifier')}
      </button>
      <button type="button" className="planning-ctx-item" onClick={() => onDuplicate(contextMenu.cr)}>
        {t('planning.ctx.dupliquer')}
      </button>
      <div className="planning-ctx-separator" />
      <button type="button" className="planning-ctx-item planning-ctx-item-danger" onClick={() => onDelete(contextMenu.cr)}>
        {t('planning.ctx.supprimer')}
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
  const { t } = useTranslation();
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
      {hoverCr.cr.professeur_nom && <div className="planning-tooltip-row">👤 {hoverCr.cr.professeur_nom}</div>}
      <div className="planning-tooltip-row" style={{ color: 'var(--text-muted)', fontSize: '0.7rem', marginTop: '0.25rem' }}>
        {t('planning.tooltip.cliquer')}
      </div>
    </div>
  );
}
