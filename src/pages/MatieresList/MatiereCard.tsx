import { Matiere } from '../../types';
import { Card } from '../../components/shared/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/shared/Button';
import { useConfirm } from '../../components/shared/ConfirmDialog';

interface MatiereCardProps {
  matiere: Matiere;
  onDelete: (id: string) => void;
  readOnly?: boolean;
}

export function MatiereCard({ matiere, onDelete, readOnly }: MatiereCardProps) {
  const confirm = useConfirm();
  const couleur = matiere.couleur || '#2563eb';

  const handleDelete = async () => {
    const ok = await confirm({
      title: 'Supprimer la matière',
      message: `Êtes-vous sûr de vouloir supprimer la matière « ${matiere.nom} » ? Toutes les notes associées seront impactées.`,
      confirmText: 'Supprimer',
      variant: 'danger',
    });
    if (ok) onDelete(matiere.id);
  };

  return (
    <Card borderTop={couleur}>
      <div className="matiere-card-header">
        <div
          className="matiere-code"
          style={{
            backgroundColor: `${couleur}20`,
            color: couleur,
          }}
        >
          {matiere.code}
        </div>
        <Badge label={`Coef. ${matiere.coefficient}`} variant="default" />
      </div>

      <h3 className="matiere-card-title">{matiere.nom}</h3>

      {matiere.description && (
        <p className="matiere-card-desc">{matiere.description}</p>
      )}

      {!readOnly && (
        <div className="matiere-card-actions">
          <Button variant="danger" size="sm" onClick={handleDelete}>
            Supprimer
          </Button>
        </div>
      )}
    </Card>
  );
}
