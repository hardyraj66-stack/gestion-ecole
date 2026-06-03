import { useEffect, useRef, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAnnees } from '../../contexts/AnneeContext';
import { useViewing } from '../../contexts/ViewingContext';
import { useAuth } from '../../contexts/AuthContext';
import { useConfirm } from '../shared/ConfirmDialog';
import { Badge } from '../ui/Badge';
import { BrandIcon } from '../brand/BrandIcon';
import { BrandWordmark } from '../brand/BrandWordmark';

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
  { label: 'Professeurs', path: '/professeurs', iconMultiple: [{ type: 'path', d: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2' }, { type: 'circle', cx: 9, cy: 7, r: 4 }, { type: 'path', d: 'M23 21v-2a4 4 0 0 0-3-3.87' }, { type: 'path', d: 'M16 3.13a4 4 0 0 1 0 7.75' }] },
  { label: 'Notes', path: '/notes', iconMultiple: [{ type: 'path', d: 'M12 20h9' }, { type: 'path', d: 'M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z' }] },
  { label: 'Périodes', path: '/evaluations', iconMultiple: [{ type: 'path', d: 'M8 2v4' }, { type: 'path', d: 'M16 2v4' }, { type: 'path', d: 'M3 10h18' }, { type: 'rect', x: 3, y: 4, width: 18, height: 18, rx: 2 }] },
  { label: 'Planning', path: '/planning', iconMultiple: [{ type: 'path', d: 'M8 2v4' }, { type: 'path', d: 'M16 2v4' }, { type: 'path', d: 'M3 10h18' }, { type: 'rect', x: 3, y: 4, width: 18, height: 18, rx: 2 }] },
  { label: 'Salles', path: '/salles', iconMultiple: [{ type: 'path', d: 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z' }, { type: 'path', d: 'M9 22V12h6v10' }] },
  { label: 'Niveaux', path: '/niveaux', iconMultiple: [{ type: 'path', d: 'M12 2L2 7l10 5 10-5-10-5z' }, { type: 'path', d: 'M2 17l10 5 10-5' }, { type: 'path', d: 'M2 12l10 5 10-5' }] },
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
  const { t } = useTranslation();
  const { active, preparation, getAll: fetchAnnees } = useAnnees();
  const { viewing, isViewingArchive, exitView } = useViewing();
  const { user, logout, hasRole } = useAuth();
  const confirm = useConfirm();

  const handleLogout = async () => {
    const ok = await confirm({
      title: t('sidebar.logoutConfirmTitle'),
      message: t('sidebar.logoutConfirmMessage'),
      confirmText: t('sidebar.logout'),
      variant: 'warning',
    });
    if (ok) logout();
  };
  const [expanded, setExpanded] = useState(false);
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchedRef = useRef(false);
  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    fetchAnnees();
  }, [fetchAnnees]);

  const displayLabel = isViewingArchive ? viewing!.label : (active?.label || preparation?.label || '—');
  const displayStatut = isViewingArchive
    ? t('sidebar.statut.archive')
    : active ? t('sidebar.statut.active') : preparation ? t('sidebar.statut.preparation') : '';
  const badgeVariant = isViewingArchive ? 'warning' : active ? 'success' : 'warning';

  const displayName = user?.nom?.trim() || user?.username || '—';
  const initials =
    displayName
      .split(/\s+/)
      .map((w) => w[0])
      .slice(0, 2)
      .join('')
      .toUpperCase() || 'U';
  const roleLabel = user ? t(`sidebar.roles.${user.role}`) : '';

  const navLabels: Record<string, string> = {
    '/dashboard': t('nav.dashboard'),
    '/classes': t('nav.classes'),
    '/eleves': t('nav.eleves'),
    '/matieres': t('nav.matieres'),
    '/professeurs': t('nav.professeurs'),
    '/notes': t('nav.notes'),
    '/evaluations': t('nav.periodes'),
    '/planning': t('nav.planning'),
    '/salles': t('nav.salles'),
    '/niveaux': t('nav.niveaux'),
  };

  const handleMouseEnter = () => {
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    hoverTimerRef.current = setTimeout(() => setExpanded(true), 80);
  };

  const handleMouseLeave = () => {
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    hoverTimerRef.current = setTimeout(() => setExpanded(false), 120);
  };

  return (
    <aside
      className={`sidebar ${expanded ? 'sidebar-expanded' : ''} ${isViewingArchive ? 'sidebar-archive' : ''}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Brand */}
      <div className="sidebar-brand">
        <div className="sidebar-brand-icon-wrap">
          <BrandIcon size={36} />
        </div>
        <div className="sidebar-brand-label">
          <BrandWordmark height={28} />
        </div>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.end}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            title={!expanded ? (navLabels[item.path] ?? item.label) : undefined}
          >
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} className="nav-item-icon">
              {item.icon
                ? <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
                : item.iconMultiple?.map((el, idx) => renderIconElement(el, idx))
              }
            </svg>
            <span className="nav-item-label">{navLabels[item.path] ?? item.label}</span>
          </NavLink>
        ))}

        <div className="sidebar-divider" />

        <NavLink to="/annee-scolaire" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} title={!expanded ? t('nav.cycle') : undefined}>
          <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} className="nav-item-icon">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span className="nav-item-label">{t('nav.cycle')}</span>
        </NavLink>

        {hasRole('admin') && (
          <NavLink to="/utilisateurs" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} title={!expanded ? t('nav.utilisateurs') : undefined}>
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} className="nav-item-icon">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-3.13a4 4 0 10-4-4 4 4 0 004 4zm6 0a4 4 0 10-1-7.87" />
            </svg>
            <span className="nav-item-label">{t('nav.utilisateurs')}</span>
          </NavLink>
        )}
      </nav>

      <div className="sidebar-footer">
        <NavLink to="/parametres" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} style={{ marginBottom: '0.5rem' }} title={!expanded ? t('nav.parametres') : undefined}>
          <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} className="nav-item-icon">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span className="nav-item-label">{t('nav.parametres')}</span>
        </NavLink>

        <div
          className="sidebar-annee-block"
          onClick={isViewingArchive ? exitView : undefined}
          style={{ cursor: isViewingArchive ? 'pointer' : 'default' }}
        >
          <div className="sidebar-annee-top">
            <span className="sidebar-annee-dot" style={{ background: isViewingArchive ? 'var(--warning)' : active ? 'var(--success)' : 'var(--warning)' }} />
            <span className="sidebar-annee-label-text">{displayLabel}</span>
            <Badge label={displayStatut} variant={badgeVariant} />
          </div>
          {isViewingArchive && (
            <span className="sidebar-annee-exit">{t('sidebar.retourAnneeEnCours')}</span>
          )}
        </div>

        <div className="sidebar-user">
          <div className="sidebar-avatar">{initials}</div>
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">{displayName}</div>
            <div className="sidebar-user-role">{roleLabel}</div>
          </div>
          <button
            type="button"
            className="sidebar-logout"
            onClick={handleLogout}
            title={t('sidebar.logout')}
            aria-label={t('sidebar.logout')}
          >
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </div>
    </aside>
  );
}
