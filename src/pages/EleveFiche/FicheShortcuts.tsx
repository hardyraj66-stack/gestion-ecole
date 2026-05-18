import { Link } from 'react-router-dom';
import { Card, CardHeader } from '../../components/shared/Card';
import { Icon } from '../../components/shared/Icon';

interface Props {
  eleveId: string;
  classeId: string;
}

const shortcuts = (eleveId: string, classeId: string) => [
  {
    label: 'Notes',
    sublabel: 'Saisir ou consulter les notes',
    to: '/notes',
    icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
    color: '#2563eb',
  },
  {
    label: 'Bulletin',
    sublabel: 'Voir le bulletin trimestriel',
    to: `/eleves/${eleveId}/bulletin`,
    icon: 'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
    color: '#16a34a',
  },
  {
    label: 'Classe',
    sublabel: 'Liste des élèves de la classe',
    to: `/classes/${classeId}/eleves`,
    icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z',
    color: '#d97706',
  },
  {
    label: 'Emploi du temps',
    sublabel: 'Planning de la classe',
    to: `/classes/${classeId}/planning`,
    icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
    color: '#7c3aed',
  },
];

export function FicheShortcuts({ eleveId, classeId }: Props) {
  return (
    <Card>
      <CardHeader title="Accès rapides" />
      <div className="fiche-shortcuts-grid">
        {shortcuts(eleveId, classeId).map(s => (
          <Link key={s.to} to={s.to} className="fiche-shortcut">
            <div className="fiche-shortcut-icon" style={{ background: `${s.color}18`, color: s.color }}>
              <Icon path={s.icon} size={20} />
            </div>
            <div className="fiche-shortcut-text">
              <span className="fiche-shortcut-label">{s.label}</span>
              <span className="fiche-shortcut-sub">{s.sublabel}</span>
            </div>
            <Icon path="M9 5l7 7-7 7" size={14} />
          </Link>
        ))}
      </div>
    </Card>
  );
}
