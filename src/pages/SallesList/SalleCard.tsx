import { useTranslation } from 'react-i18next';
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
  amphi: '#d97706',
  autre: '#64748b',
};

const typeIcons: Record<TypeSalle, string> = {
  standard: 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z',
  laboratoire: 'M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2V9M9 21H5a2 2 0 0 1-2-2V9m0 0h18',
  informatique: 'M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2z',
  sport: 'M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z',
  arts: 'M12 19l7-7 3 3-7 7-3-3z M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z M2 2l7.586 7.586',
  amphi: 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z',
  autre: 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z',
};

interface SalleCardProps {
  salle: Salle;
  onEdit: (salle: Salle) => void;
  onDelete: (id: string) => void;
  onView: (salle: Salle) => void;
  readOnly?: boolean;
}

export function SalleCard({ salle, onEdit, onDelete, onView, readOnly }: SalleCardProps) {
  const { t } = useTranslation();
  const confirm = useConfirm();
  const color = typeColors[salle.type] || '#64748b';

  const handleDelete = async () => {
    const ok = await confirm({
      title: t('salles.supprimer'),
      message: t('salles.card.confirmeSuppr', { nom: salle.nom }),
      confirmText: t('salles.supprimerBtn'),
      variant: 'danger',
    });
    if (ok) onDelete(salle.id);
  };

  return (
    <Card borderTop={color}>
      <div className="salle-card-header">
        <div className="salle-card-badges">
          <span className="salle-type-badge" style={{ backgroundColor: `${color}20`, color }}>
            <Icon path={typeIcons[salle.type] || typeIcons.standard} size={14} />
            {getTypeLabel(salle.type)}
          </span>
          <Badge label={t('salles.card.places', { count: salle.capacite })} variant="default" />
          {salle.accessible_pmr && <Badge label="PMR" variant="success" />}
        </div>
      </div>

      <h3 className="salle-card-title">{salle.nom}</h3>

      {salle.description && (
        <p className="salle-card-desc">{salle.description}</p>
      )}

      {(salle.batiment || salle.etage) && (
        <p className="salle-card-desc" style={{ display: 'flex', gap: '0.5rem' }}>
          {salle.batiment && <span>{t('salles.detail.batiment')} {salle.batiment}</span>}
          {salle.etage && <span>· {t('salles.detail.etage')} {salle.etage}</span>}
        </p>
      )}

      {salle.equipements && salle.equipements.length > 0 && (
        <div className="salle-card-equipements">
          {salle.equipements.slice(0, 3).map(eq => (
            <Badge key={eq} label={eq.replace(/_/g, ' ')} variant="info" />
          ))}
          {salle.equipements.length > 3 && (
            <Badge label={`+${salle.equipements.length - 3}`} variant="default" />
          )}
        </div>
      )}

      <div className="salle-card-actions">
        <Button variant="outline" size="sm" onClick={() => onView(salle)}>
          {t('salles.card.voir')}
        </Button>
        {!readOnly && (
          <>
            <Button variant="outline" size="sm" onClick={() => onEdit(salle)}>
              {t('salles.card.modifier')}
            </Button>
            <Button variant="danger" size="sm" onClick={handleDelete}>
              {t('salles.card.supprimer')}
            </Button>
          </>
        )}
      </div>
    </Card>
  );
}
