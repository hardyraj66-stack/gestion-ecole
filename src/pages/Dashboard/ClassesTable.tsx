import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Classe } from '../../types';
import { Pagination, paginate } from '../../components/shared/Pagination';

interface ClasseWithCount extends Classe {
  nb_eleves: number;
  taux: number;
}

interface ClassesTableProps {
  classes: ClasseWithCount[];
}

const PAGE_SIZE = 5;

export function ClassesTable({ classes }: ClassesTableProps) {
  const [page, setPage] = useState(1);
  const paged = paginate(classes, page, PAGE_SIZE);

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">Classes</h3>
        <Link to="/classes" className="link-primary">Voir tout →</Link>
      </div>
      <div className="table-wrapper">
        <table className="table">
          <thead>
            <tr>
              <th>Classe</th>
              <th>Niveau</th>
              <th>Salle</th>
              <th>Élèves</th>
              <th>Remplissage</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {paged.map((classe) => (
              <tr key={classe.id}>
                <td><strong>{classe.nom}</strong></td>
                <td>{classe.niveau}</td>
                <td>{classe.salle}</td>
                <td>{classe.nb_eleves} / {classe.capacite}</td>
                <td style={{ width: '150px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div className="progress" style={{ flex: 1 }}>
                      <div
                        className={`progress-bar ${classe.taux >= 90 ? 'full' : ''}`}
                        style={{ width: `${classe.taux}%` }}
                      />
                    </div>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', width: '35px' }}>
                      {classe.taux}%
                    </span>
                  </div>
                </td>
                <td>
                  <Link to={`/classes/${classe.id}/eleves`} className="btn btn-sm btn-outline">
                    Voir
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination currentPage={page} totalItems={classes.length} pageSize={PAGE_SIZE} onPageChange={setPage} />
    </div>
  );
}
