import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { API_BASE_URL } from '../../config/api';
import { useAuth, Role } from '../../contexts/AuthContext';
import { useSettings } from '../../contexts/SettingsContext';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card } from '../../components/shared/Card';
import { Input } from '../../components/shared/Input';
import { Button } from '../../components/shared/Button';
import { Badge } from '../../components/ui/Badge';
import { Icon } from '../../components/shared/Icon';
import { ChangePasswordSection } from '../../components/account/ChangePasswordSection';

const ROLE_VARIANT: Record<Role, 'success' | 'info' | 'warning'> = {
  admin: 'success',
  secretaire: 'info',
  professeur: 'warning',
};

const LANG_OPTIONS: { value: 'fr' | 'en' | 'mg'; flag: string; label: string }[] = [
  { value: 'fr', flag: '🇫🇷', label: 'Français' },
  { value: 'en', flag: '🇬🇧', label: 'English' },
  { value: 'mg', flag: '🇲🇬', label: 'Malagasy' },
];

export function Profil() {
  const { t } = useTranslation();
  const { user, updateProfile, logoutAll } = useAuth();
  const { settings, setTheme, setLanguage } = useSettings();

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ nom: user?.nom || '', email: user?.email || '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Sessions par appareil
  type Session = { jti: string; userAgent: string; ip: string; createdAt: string; current: boolean };
  const [sessions, setSessions] = useState<Session[]>([]);

  const loadSessions = () => {
    fetch(`${API_BASE_URL}/auth/sessions`)
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => setSessions(Array.isArray(d) ? d : []))
      .catch(() => setSessions([]));
  };
  useEffect(() => { loadSessions(); }, []);

  const revokeSession = async (jti: string) => {
    await fetch(`${API_BASE_URL}/auth/sessions/${jti}`, { method: 'DELETE' }).catch(() => {});
    loadSessions();
  };

  if (!user) return null;

  const roleLabel = t(`sidebar.roles.${user.role}`, user.role);
  const fmt = (d?: string | null, withTime = false) =>
    d ? new Date(d).toLocaleString('fr-FR', withTime ? { dateStyle: 'medium', timeStyle: 'short' } : { dateStyle: 'long' }) : null;
  const lastLogin = fmt(user.lastLoginAt, true);
  const memberSince = fmt(user.createdAt);
  const initials = (user.nom || user.username || '?')
    .trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase();

  const startEdit = () => { setForm({ nom: user.nom || '', email: user.email || '' }); setError(''); setEditing(true); };

  const handleSave = async () => {
    setError('');
    setSaving(true);
    const res = await updateProfile({ nom: form.nom.trim(), email: form.email.trim() });
    setSaving(false);
    if (res.ok) setEditing(false);
    else setError(res.error || t('profil.erreur', 'Échec de la mise à jour.'));
  };

  return (
    <div className="page-content">
     <div style={{ maxWidth: 1100, margin: '0 auto' }}>
      <PageHeader title={t('profil.titre', 'Mon profil')} subtitle={t('profil.sousTitre', 'Vos informations et votre sécurité')} />

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.25rem', alignItems: 'flex-start' }}>
        {/* Colonne gauche */}
        <div style={{ flex: '1.5 1 360px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

          {/* Informations */}
          <Card>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem' }}>
              <div style={{
                width: 56, height: 56, borderRadius: '50%', flexShrink: 0,
                background: 'var(--primary)', color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 700, fontSize: '1.25rem',
              }}>{initials}</div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: '1.15rem', fontWeight: 700, lineHeight: 1.2 }}>{user.nom || user.username}</div>
                <div style={{ marginTop: 6 }}><Badge label={roleLabel} variant={ROLE_VARIANT[user.role]} /></div>
              </div>
              {!editing && (
                <Button variant="secondary" size="sm" onClick={startEdit} style={{ marginLeft: 'auto' }}>
                  <Icon path="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" size={14} />
                  {' '}{t('common.modifier', 'Modifier')}
                </Button>
              )}
            </div>

            {error && <div className="login-error" style={{ marginBottom: '1rem' }}>{error}</div>}

            {editing ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <Input label={t('profil.nom', 'Nom')} value={form.nom} onChange={(e) => setForm((f) => ({ ...f, nom: e.target.value }))} />
                <Input label={t('profil.email', 'Email')} type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
                  <Button variant="secondary" onClick={() => setEditing(false)}>{t('common.annuler', 'Annuler')}</Button>
                  <Button variant="primary" onClick={handleSave} loading={saving} disabled={saving}>{t('common.enregistrer', 'Enregistrer')}</Button>
                </div>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1.1rem' }}>
                <Field label={t('profil.identifiant', 'Identifiant')} value={user.username} />
                <Field label={t('profil.email', 'Email')} value={user.email || '—'} />
                <div>
                  <div className="settings-label">{t('profil.statut', 'Statut du compte')}</div>
                  <div style={{ marginTop: 6 }}>
                    {user.mustChangePassword
                      ? <Badge label={t('users.pending', 'En attente')} variant="warning" />
                      : <Badge label={t('users.confirmed', 'Confirmé')} variant="success" />}
                  </div>
                </div>
              </div>
            )}
          </Card>

          {/* Activité du compte */}
          <Card>
            <div className="settings-section-title" style={{ marginBottom: '1rem' }}>{t('profil.activite', 'Activité du compte')}</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1.1rem' }}>
              <Field label={t('profil.membreDepuis', 'Membre depuis')} value={memberSince || '—'} />
              <Field label={t('profil.derniereConnexion', 'Dernière connexion')} value={lastLogin || t('profil.jamais', 'Jamais')} />
            </div>
          </Card>

          {/* Préférences */}
          <Card>
            <div className="settings-section-title" style={{ marginBottom: '1rem' }}>{t('profil.preferences', 'Préférences')}</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.1rem' }}>
              <div>
                <div style={{ fontWeight: 600 }}>{t('parametres.apparence.sombreTitre', 'Mode sombre')}</div>
                <div className="settings-description">
                  {settings.theme === 'dark' ? t('parametres.apparence.sombre', 'Activé') : t('parametres.apparence.clair', 'Désactivé')}
                </div>
              </div>
              <label className="toggle-switch">
                <input type="checkbox" checked={settings.theme === 'dark'} onChange={(e) => setTheme(e.target.checked ? 'dark' : 'light')} />
                <span className="toggle-slider" />
              </label>
            </div>
            <div>
              <div className="settings-label" style={{ marginBottom: 8 }}>{t('profil.langue', 'Langue')}</div>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {LANG_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    className={`lang-btn${settings.language === opt.value ? ' active' : ''}`}
                    onClick={() => setLanguage(opt.value)}
                  >
                    {opt.flag} {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </Card>
        </div>

        {/* Colonne droite : sécurité */}
        <div style={{ flex: '1 1 300px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <ChangePasswordSection />

          <div className="settings-section" style={{ margin: 0 }}>
            <div className="settings-section-title">{t('profil.sessions', 'Sessions')}</div>
            <div className="settings-description" style={{ marginBottom: '0.85rem' }}>
              {t('profil.sessionsListDesc', 'Appareils actuellement connectés à votre compte.')}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginBottom: '1rem' }}>
              {sessions.length === 0 && (
                <div className="settings-description">{t('profil.aucuneSession', 'Aucune session active.')}</div>
              )}
              {sessions.map((s) => (
                <div key={s.jti} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.6rem 0.75rem', border: '1px solid var(--border)', borderRadius: 8 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                      {deviceLabel(s.userAgent)}
                      {s.current && <Badge label={t('profil.cetAppareil', 'Cet appareil')} variant="success" />}
                    </div>
                    <div className="settings-description" style={{ fontSize: '0.78rem' }}>
                      {(s.ip || '—')} · {new Date(s.createdAt).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })}
                    </div>
                  </div>
                  {!s.current && (
                    <Button variant="outline" size="sm" onClick={() => revokeSession(s.jti)}>
                      {t('profil.revoquer', 'Révoquer')}
                    </Button>
                  )}
                </div>
              ))}
            </div>
            <Button variant="secondary" onClick={() => logoutAll()}>
              {t('profil.logoutAll', 'Déconnecter toutes les sessions')}
            </Button>
          </div>
        </div>
      </div>
     </div>
    </div>
  );
}

function deviceLabel(ua: string): string {
  if (!ua) return 'Appareil inconnu';
  const browser = /Edg/.test(ua) ? 'Edge'
    : /OPR|Opera/.test(ua) ? 'Opera'
    : /Chrome/.test(ua) ? 'Chrome'
    : /Firefox/.test(ua) ? 'Firefox'
    : /Safari/.test(ua) ? 'Safari'
    : 'Navigateur';
  const os = /Windows/.test(ua) ? 'Windows'
    : /Mac OS X|Macintosh/.test(ua) ? 'macOS'
    : /Android/.test(ua) ? 'Android'
    : /iPhone|iPad|iOS/.test(ua) ? 'iOS'
    : /Linux/.test(ua) ? 'Linux'
    : '';
  return os ? `${browser} · ${os}` : browser;
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ minWidth: 0 }}>
      <div className="settings-label">{label}</div>
      <div style={{ fontSize: '0.95rem', color: 'var(--text)', wordBreak: 'break-word' }}>{value}</div>
    </div>
  );
}
