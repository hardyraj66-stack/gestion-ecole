import { Classe } from '../../types';
import { Card } from '../../components/shared/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/shared/Button';
import { ProgressBar } from '../../components/shared/ProgressBar';
import { Icon } from '../../components/shared/Icon';
import { useConfirm } from '../../components/shared/ConfirmDialog';

interface ClasseCardProps {
  classe: Classe & { nb_eleves: number; taux: number };
  onDelete: (id: string) => void;
  onEdit?: (classe: any) => void;
  readOnly?: boolean;
}

export function ClasseCard({ classe, onDelete, onEdit, readOnly }: ClasseCardProps) {
  const confirm = useConfirm();

  const handleDelete = async () => {
    const ok = await confirm({
      title: 'Supprimer la classe',
      message: `Êtes-vous sûr de vouloir supprimer la classe « ${classe.nom} » ?`,
      confirmText: 'Supprimer',
      variant: 'danger',
    });
    if (ok) onDelete(classe.id);
  };

  return (
    <Card>
      <div className="classe-card-inner">
        <div className="classe-card-header">
          <h3 className="classe-card-title">{classe.nom}</h3>
          <Badge label={classe.niveau} variant="primary" />
        </div>

        <div className="classe-card-meta">
          <div className="classe-card-meta-item">
            <Icon path="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" size={16} />
            <span>{classe.salle}</span>
          </div>
          <div className="classe-card-meta-item">
            <Badge label={classe.salle_type === 'fixe' ? 'Fixe' : 'Variable'} variant={classe.salle_type === 'fixe' ? 'info' : 'warning'} />
          </div>
        </div>

        <div className="classe-card-capacity">
          <div className="classe-card-capacity-text">
            <span className="classe-card-capacity-label">Élèves</span>
            <span className="classe-card-capacity-value">{classe.nb_eleves} / {classe.capacite}</span>
          </div>
          <ProgressBar value={classe.taux} />
        </div>

        <div className="classe-card-actions">
          <Button as="link" to={`/classes/${classe.id}/eleves`} variant="primary" size="sm">Élèves</Button>
          <Button as="link" to={`/classes/${classe.id}/planning`} variant="outline" size="sm">Planning</Button>
          {!readOnly && onEdit && (
            <Button variant="secondary" size="sm" onClick={() => onEdit(classe)}>✎</Button>
          )}
          {!readOnly && (
            <Button variant="danger" size="sm" onClick={handleDelete}>✕</Button>
          )}
        </div>
      </div>
    </Card>
  );
}
