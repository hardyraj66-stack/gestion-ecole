import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card } from '../../components/shared/Card';
import { Input } from '../../components/shared/Input';
import { Button } from '../../components/shared/Button';
import { Badge } from '../../components/ui/Badge';
import { Icon } from '../../components/shared/Icon';
import { ChangePasswordSection } from '../../components/account/ChangePasswordSection';

export function Profil() {
  const { t } = useTranslation();
  const { user, updateProfile, logoutAll } = useAuth();

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ nom: user?.nom || '', email: user?.email || '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  if (!user) return null;

  const roleLabel = t(`sidebar.roles.${user.role}`, user.role);
  const lastLogin = user.lastLoginAt
    ? new Date(user.lastLoginAt).toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' })
    : null;

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
      <PageHeader title={t('profil.titre', 'Mon profil')} subtitle={t('profil.sousTitre', 'Vos informations et votre sécurité')} />

      <div className="settings-page">
        {/* Informations */}
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div className="settings-section-title" style={{ margin: 0 }}>{t('profil.informations', 'Informations')}</div>
            {!editing && (
              <Button variant="secondary" size="sm" onClick={startEdit}>
                <Icon path="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" size={14} />
                {' '}{t('common.modifier', 'Modifier')}
              </Button>
            )}
          </div>

          {error && <div className="login-error" style={{ marginBottom: '1rem' }}>{error}</div>}

          {editing ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxWidth: 420 }}>
              <Input label={t('profil.nom', 'Nom')} value={form.nom} onChange={(e) => setForm((f) => ({ ...f, nom: e.target.value }))} />
              <Input label={t('profil.email', 'Email')} type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
                <Button variant="secondary" onClick={() => setEditing(false)}>{t('common.annuler', 'Annuler')}</Button>
                <Button variant="primary" onClick={handleSave} loading={saving} disabled={saving}>{t('common.enregistrer', 'Enregistrer')}</Button>
              </div>
            </div>
          ) : (
            <div className="profil-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
              <Field label={t('profil.nom', 'Nom')} value={user.nom || '—'} />
              <Field label={t('profil.email', 'Email')} value={user.email || '—'} />
              <Field label={t('profil.identifiant', 'Identifiant')} value={user.username} />
              <Field label={t('profil.role', 'Rôle')} value={roleLabel} />
              <div>
                <div className="settings-label">{t('profil.statut', 'Statut du compte')}</div>
                <div style={{ marginTop: 4 }}>
                  {user.mustChangePassword
                    ? <Badge label={t('users.pending', 'En attente')} variant="warning" />
                    : <Badge label={t('users.confirmed', 'Confirmé')} variant="success" />}
                </div>
              </div>
              {lastLogin && <Field label={t('profil.derniereConnexion', 'Dernière connexion')} value={lastLogin} />}
            </div>
          )}
        </Card>

        {/* Sécurité */}
        <ChangePasswordSection />

        <div className="settings-section">
          <div className="settings-section-title">{t('profil.sessions', 'Sessions')}</div>
          <div className="settings-description" style={{ marginBottom: '0.75rem' }}>
            {t('profil.sessionsDesc', 'Déconnecte tous les appareils où vous êtes connecté (y compris celui-ci).')}
          </div>
          <Button variant="secondary" onClick={() => logoutAll()}>
            {t('profil.logoutAll', 'Déconnecter toutes les sessions')}
          </Button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="settings-label">{label}</div>
      <div className="settings-description" style={{ fontSize: '0.95rem', color: 'var(--text)' }}>{value}</div>
    </div>
  );
}
