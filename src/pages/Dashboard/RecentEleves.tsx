import { Link } from 'react-router-dom';
import { Eleve, Classe } from '../../types';
import { Avatar } from '../../components/shared/Avatar';
import { getInitials } from '../../utils/helpers';

interface RecentElevesProps {
  eleves: Eleve[];
  classes: Classe[];
}

export function RecentEleves({ eleves, classes }: RecentElevesProps) {
  const recentEleves = eleves.slice(-5).reverse();

  const getClasseName = (classeId: string): string => {
    const classe = classes.find(c => c.id === classeId);
    return classe?.nom || '—';
  };

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">Derniers élèves inscrits</h3>
        <Link to="/eleves" className="link-primary">Voir tout →</Link>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {recentEleves.map((eleve) => (
          <div 
            key={eleve.id} 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              padding: '0.5rem 0',
              borderBottom: '1px solid var(--border)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Avatar initiales={getInitials(eleve)} genre={eleve.genre} />
              <div>
                <div style={{ fontWeight: 500, fontSize: '0.9rem' }}>
                  {eleve.prenom} {eleve.nom}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  {getClasseName(eleve.classe_id)}
                </div>
              </div>
            </div>
            <Link to={`/eleves/${eleve.id}/bulletin`} className="btn btn-sm btn-outline">
              Bulletin
            </Link>
          </div>
        ))}
        {recentEleves.length === 0 && (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
            Aucun élève inscrit
          </div>
        )}
      </div>
    </div>
  );
}
