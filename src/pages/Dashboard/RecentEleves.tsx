import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Avatar } from '../../components/shared/Avatar';
import { getInitials } from '../../utils/helpers';

interface RecentEleve {
  id: string;
  nom: string;
  prenom: string;
  genre: 'M' | 'F';
  classe_id: string;
  classe_nom: string;
}

interface RecentElevesProps {
  eleves: RecentEleve[];
}

export function RecentEleves({ eleves }: RecentElevesProps) {
  const { t } = useTranslation();

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">{t('dashboard.derniersEleves')}</h3>
        <Link to="/eleves" className="link-primary">{t('dashboard.voirTout')}</Link>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {eleves.map((eleve) => (
          <div
            key={eleve.id}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--border)' }}
          >
            <div className="eleve-info">
              <Avatar initiales={getInitials(eleve)} genre={eleve.genre} />
              <div>
                <div className="eleve-name">{eleve.prenom} {eleve.nom}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{eleve.classe_nom}</div>
              </div>
            </div>
            <Link to={`/eleves/${eleve.id}/bulletin`} className="btn btn-sm btn-outline">{t('dashboard.bulletin')}</Link>
          </div>
        ))}
        {eleves.length === 0 && (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>{t('eleves.aucun')}</div>
        )}
      </div>
    </div>
  );
}
