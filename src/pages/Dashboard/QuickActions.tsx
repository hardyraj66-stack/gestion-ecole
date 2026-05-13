import { Link } from 'react-router-dom';

const actions = [
  {
    label: 'Nouvelle classe',
    path: '/classes/nouvelle',
    icon: 'M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
  },
  {
    label: 'Nouvel élève',
    path: '/eleves/nouveau',
    icon: 'M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z',
  },
  {
    label: 'Saisir des notes',
    path: '/notes',
    icon: 'M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z',
  },
  {
    label: 'Voir le planning',
    path: '/classes',
    icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
  },
];

export function QuickActions() {
  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">Accès rapides</h3>
      </div>
      <div className="quick-actions">
        {actions.map((action) => (
          <Link key={action.path} to={action.path} className="quick-action">
            <div className="quick-action-icon">
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d={action.icon} />
              </svg>
            </div>
            <span>{action.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
