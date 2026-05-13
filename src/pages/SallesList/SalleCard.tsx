import { Salle, TypeSalle } from '../../types';
import { Card } from '../../components/shared/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/shared/Button';
import { Icon } from '../../components/shared/Icon';
import { useConfirm } from '../../components/shared/ConfirmDialog';
import { getTypeLabel } from '../../utils/helpers';

const typeColors: Record<TypeSalle, string> = {
  standard: '#2563eb',
  laboratoire: '#7c3aed',
  informatique: '#0891b2',
  sport: '#16a34a',
  arts: '#db2777',
};

const typeIcons: Record<TypeSalle, string> = {
  standard: 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z',
  laboratoire: 'M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2V9M9 21H5a2 2 0 0 1-2-2V9m0 0h18',
  informatique: 'M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2z',
  sport: 'M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z',
  arts: 'M12 19l7-7 3 3-7 7-3-3z M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z M2 2l7.586 7.586',
};

interface SalleCardProps {
  salle: Salle;
  onEdit: (salle: Salle) => void;
  onDelete: (id: string) => void;
  readOnly?: boolean;
}

export function SalleCard({ salle, onEdit, onDelete, readOnly }: SalleCardProps) {
  const confirm = useConfirm();
  const color = typeColors[salle.type];

  const handleDelete = async () => {
    const ok = await confirm({
      title: 'Supprimer la salle',
      message: `Êtes-vous sûr de vouloir supprimer la salle « ${salle.nom} » ? Les créneaux utilisant cette salle ne seront pas supprimés.`,
      confirmText: 'Supprimer',
      variant: 'danger',
    });
    if (ok) onDelete(salle.id);
  };

  return (
    <Card borderTop={color}>
      <div className="salle-card-header">
        <div className="salle-card-badges">
          <span
            className="salle-type-badge"
            style={{
              backgroundColor: `${color}20`,
              color: color,
            }}
          >
            <Icon path={typeIcons[salle.type]} size={14} />
            {getTypeLabel(salle.type)}
          </span>
          <Badge label={`${salle.capacite} places`} variant="default" />
        </div>
      </div>

      <h3 className="salle-card-title">{salle.nom}</h3>

      {salle.description && (
        <p className="salle-card-desc">{salle.description}</p>
      )}

      {!readOnly && (
        <div className="salle-card-actions">
          <Button variant="outline" size="sm" onClick={() => onEdit(salle)}>
            Modifier
          </Button>
          <Button variant="danger" size="sm" onClick={handleDelete}>
            Supprimer
          </Button>
        </div>
      )}
    </Card>
  );
}
