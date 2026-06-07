import { useTranslation } from 'react-i18next';
import { Eleve, Classe, BulletinMatiere } from '../../types';
import { Card } from '../../components/shared/Card';
import { Avatar } from '../../components/shared/Avatar';
import { Badge } from '../../components/ui/Badge';
import { getInitials, getMention, getNoteColor } from '../../utils/helpers';

interface StudentCardProps {
  eleve: Eleve;
  classe: Classe | undefined;
  bulletinMatieres: BulletinMatiere[];
  moyenneGenerale: number | null;
}

export function StudentCard({ eleve, classe, bulletinMatieres, moyenneGenerale }: StudentCardProps) {
  const { t } = useTranslation();
  const hasNotes = bulletinMatieres.some(m => m.ds !== null || m.evaluation !== null);
  const mention = moyenneGenerale !== null ? getMention(moyenneGenerale) : null;

  return (
    <Card className="student-card">
      <Avatar
        initiales={getInitials(eleve)}
        genre={eleve.genre}
        size="lg"
      />
      <h2 className="student-card-name">{eleve.prenom} {eleve.nom}</h2>
      <p className="student-card-class">
        {classe?.nom || '—'} • {classe?.annee_scolaire || '—'}
      </p>
      {eleve.email && (
        <p className="student-card-email">{eleve.email}</p>
      )}

      {hasNotes && moyenneGenerale !== null && (
        <div className="student-moyenne">
          <div className="student-moyenne-label">{t('bulletin.moyenneGenerale')}</div>
          <div
            className="student-moyenne-value"
            style={{ color: getNoteColor(moyenneGenerale) }}
          >
            {moyenneGenerale.toFixed(1)}{t('bulletin.sur20')}
          </div>
          {mention && (
            <Badge label={mention.label} variant={mention.variant} />
          )}
        </div>
      )}
    </Card>
  );
}
