import { useEffect, useRef } from 'react';
import { NavLink } from 'react-router-dom';
import { useAnnees } from '../../contexts/AnneeContext';
import { useViewing } from '../../contexts/ViewingContext';
import { Badge } from '../ui/Badge';

type IconElement =
  | { type: 'path'; d: string }
  | { type: 'circle'; cx: number; cy: number; r: number }
  | { type: 'rect'; x: number; y: number; width: number; height: number; rx: number };

interface NavItem {
  label: string;
  path: string;
  icon?: string;
  iconMultiple?: IconElement[];
  end?: boolean;
}

const navItems: NavItem[] = [
  { label: 'Dashboard', path: '/dashboard', icon: 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z', end: true },
  { label: 'Classes', path: '/classes', icon: 'M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z' },
  { label: 'Élèves', path: '/eleves', iconMultiple: [{ type: 'path', d: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2' }, { type: 'circle', cx: 9, cy: 7, r: 4 }] },
  { label: 'Matières', path: '/matieres', iconMultiple: [{ type: 'path', d: 'M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z' }, { type: 'path', d: 'M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z' }] },
  { label: 'Notes', path: '/notes', iconMultiple: [{ type: 'path', d: 'M12 20h9' }, { type: 'path', d: 'M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z' }] },
  { label: 'Planning', path: '/planning', iconMultiple: [{ type: 'path', d: 'M8 2v4' }, { type: 'path', d: 'M16 2v4' }, { type: 'path', d: 'M3 10h18' }, { type: 'rect', x: 3, y: 4, width: 18, height: 18, rx: 2 }] },
  { label: 'Salles', path: '/salles', iconMultiple: [{ type: 'path', d: 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z' }, { type: 'path', d: 'M9 22V12h6v10' }] },
];

function renderIconElement(el: IconElement, idx: number) {
  switch (el.type) {
    case 'path': return <path key={idx} strokeLinecap="round" strokeLinejoin="round" d={el.d} />;
    case 'circle': return <circle key={idx} cx={el.cx} cy={el.cy} r={el.r} />;
    case 'rect': return <rect key={idx} x={el.x} y={el.y} width={el.width} height={el.height} rx={el.rx} />;
    default: return null;
  }
}

export function Sidebar() {
  const { active, preparation, getAll: fetchAnnees } = useAnnees();
  const { viewing, isViewingArchive, exitView } = useViewing();

  const fetchedRef = useRef(false);
  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    fetchAnnees();
  }, [fetchAnnees]);

  const displayLabel = isViewingArchive ? viewing!.label : (active?.label || preparation?.label || '—');
  const displayStatut = isViewingArchive ? 'Archive' : active ? 'Active' : preparation ? 'Préparation' : '';
  const badgeVariant = isViewingArchive ? 'warning' : active ? 'success' : 'warning';

  return (
    <aside className={`sidebar ${isViewingArchive ? 'sidebar-archive' : ''}`}>
      <div className="sidebar-brand">
        <div className="sidebar-brand-icon">
          <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          </svg>
        </div>
        <span className="sidebar-brand-text">GestionÉcole</span>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <NavLink key={item.path} to={item.path} end={item.end} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              {item.icon
                ? <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
                : item.iconMultiple?.map((el, idx) => renderIconElement(el, idx))
              }
            </svg>
            <span>{item.label}</span>
          </NavLink>
        ))}

        <div style={{ margin: '0.75rem 0', borderTop: '1px solid #1e293b' }} />

        <NavLink to="/annee-scolaire" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span>Cycle scolaire</span>
        </NavLink>
      </nav>

      <div className="sidebar-footer">
        {/* Encart année scolaire */}
        <div
          onClick={isViewingArchive ? exitView : undefined}
          style={{
            padding: '0.6rem 0.75rem',
            borderRadius: '8px',
            background: isViewingArchive ? '#78350f' : '#1e293b',
            marginBottom: '0.75rem',
            cursor: isViewingArchive ? 'pointer' : 'default',
            transition: 'background 0.15s',
            border: isViewingArchive ? '1px solid var(--warning)' : 'none',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ color: '#94a3b8', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Année scolaire</span>
            <Badge label={displayStatut} variant={badgeVariant} />
          </div>
          <div style={{ color: 'white', fontWeight: 600, fontSize: '0.95rem', marginTop: '0.2rem' }}>
            {displayLabel}
          </div>
          {isViewingArchive && (
            <div style={{ color: '#fbbf24', fontSize: '0.7rem', marginTop: '0.3rem' }}>
              ✕ Cliquer pour revenir à l'année en cours
            </div>
          )}
        </div>

        <div className="sidebar-user">
          <div className="sidebar-avatar">AD</div>
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">Administrateur</div>
            <div className="sidebar-user-role">Admin · {displayLabel}</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
