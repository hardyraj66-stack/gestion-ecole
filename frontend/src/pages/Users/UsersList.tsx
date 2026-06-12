import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { API_BASE_URL } from '../../config/api';
import { useAuth, Role } from '../../contexts/AuthContext';
import { useConfirm } from '../../components/shared/ConfirmDialog';
import { PageHeader } from '../../components/ui/PageHeader';
import { Badge } from '../../components/ui/Badge';
import { PresenceDot } from '../../components/ui/PresenceDot';
import { usePresence } from '../../hooks/usePresence';
import { Button } from '../../components/shared/Button';
import { Input } from '../../components/shared/Input';
import { Select } from '../../components/shared/Select';
import { Modal } from '../../components/shared/Modal';

interface UserRow {
  id: string;
  username: string;
  nom: string;
  email?: string;
  role: Role;
  actif: boolean;
  /** true tant que l'utilisateur n'a pas changé le mot de passe généré (compte non confirmé). */
  mustChangePassword?: boolean;
  lastLoginAt?: string | null;
}

const fmtDateTime = (d?: string | null) =>
  d ? new Date(d).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' }) : '—';

const ROLE_VARIANT: Record<Role, 'success' | 'info' | 'warning'> = {
  admin: 'success',
  secretaire: 'info',
  professeur: 'warning',
};

export function UsersList() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const confirm = useConfirm();
  const { user: me } = useAuth();
  const { isOnline, sessions } = usePresence();

  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const roleOptions = [
    { value: 'admin', label: t('sidebar.roles.admin') },
    { value: 'secretaire', label: t('sidebar.roles.secretaire') },
    { value: 'professeur', label: t('sidebar.roles.professeur') },
  ];

  const load = useCallback(async () => {
    setError('');
    try {
      const res = await fetch(`${API_BASE_URL}/users`);
      if (!res.ok) throw new Error();
      setUsers(await res.json());
    } catch {
      setError(t('users.errorLoad'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    load();
  }, [load]);

  // --- Création ---
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ username: '', nom: '', prenom: '', email: '', genre: 'M', role: 'secretaire' as Role });
  const [formError, setFormError] = useState('');
  // Id du professeur existant en cas de doublon d'email → lien vers sa fiche.
  const [dupProfId, setDupProfId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [accountResult, setAccountResult] = useState<{ username: string; emailSent: boolean; password?: string } | null>(null);

  const resetForm = () => setForm({ username: '', nom: '', prenom: '', email: '', genre: 'M', role: 'secretaire' });

  const submitCreate = async () => {
    setFormError('');
    setDupProfId(null);
    const isProf = form.role === 'professeur';
    if (!form.email.trim()) {
      setFormError(t('users.emailRequiredMsg', "L'email est requis."));
      return;
    }
    if (isProf) {
      // Un professeur a une fiche : nom + prénom requis (identifiant = email).
      if (!form.nom.trim() || !form.prenom.trim()) {
        setFormError(t('users.profNameRequired', 'Nom et prénom sont requis pour un professeur.'));
        return;
      }
    } else if (!form.username.trim()) {
      setFormError(t('users.usernameRequired', "L'identifiant est requis."));
      return;
    }
    setSaving(true);
    try {
      // Rôle professeur → on crée la FICHE professeur (qui crée aussi le compte + envoie l'email),
      // donc il apparaît dans la liste des professeurs. Sinon, simple compte.
      const url = isProf ? `${API_BASE_URL}/professeurs` : `${API_BASE_URL}/users`;
      const payload = isProf
        ? { nom: form.nom, prenom: form.prenom, email: form.email, genre: form.genre }
        : { username: form.username, nom: form.nom, email: form.email, role: form.role };
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setFormError(body?.message || t('users.errorCreate'));
        setDupProfId(body?.professeurId || null);
        return;
      }
      setShowCreate(false);
      resetForm();
      if (body?.account) setAccountResult(body.account);
      load();
    } finally {
      setSaving(false);
    }
  };

  // --- Mutations ---
  const patchUser = async (id: string, data: Partial<Pick<UserRow, 'role' | 'actif'>>) => {
    const res = await fetch(`${API_BASE_URL}/users/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      await confirm({ message: body?.message || t('users.errorUpdate'), confirmText: 'OK', variant: 'warning' });
    }
    load();
  };

  // --- Édition (nom + email) ---
  const [editUser, setEditUser] = useState<UserRow | null>(null);
  const [editForm, setEditForm] = useState({ nom: '', email: '' });
  const [editError, setEditError] = useState('');
  const [editSaving, setEditSaving] = useState(false);

  const openEdit = (u: UserRow) => { setEditUser(u); setEditForm({ nom: u.nom || '', email: u.email || '' }); setEditError(''); };

  const submitEdit = async () => {
    if (!editUser) return;
    setEditError('');
    setEditSaving(true);
    try {
      const res = await fetch(`${API_BASE_URL}/users/${editUser.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nom: editForm.nom, email: editForm.email }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) { setEditError(body?.message || t('users.errorUpdate')); return; }
      setEditUser(null);
      load();
    } finally {
      setEditSaving(false);
    }
  };

  // --- Comptes archivés ---
  const [showArchived, setShowArchived] = useState(false);
  const [archived, setArchived] = useState<UserRow[]>([]);

  const loadArchived = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/users/archives`);
      if (res.ok) setArchived(await res.json());
    } catch { /* ignoré */ }
  }, []);

  const toggleArchived = () => {
    const next = !showArchived;
    setShowArchived(next);
    if (next) loadArchived();
  };

  const restoreUser = async (u: UserRow) => {
    const res = await fetch(`${API_BASE_URL}/users/${u.id}/restaurer`, { method: 'PATCH' });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      await confirm({ message: body?.message || t('users.errorUpdate'), confirmText: 'OK', variant: 'warning' });
    }
    loadArchived();
    load();
  };

  // --- Réinitialisation du mot de passe (modale) ---
  const [resetUser, setResetUser] = useState<UserRow | null>(null);
  const [resetPwd, setResetPwd] = useState('');
  const [resetError, setResetError] = useState('');
  const [resetSaving, setResetSaving] = useState(false);

  const openReset = (u: UserRow) => { setResetUser(u); setResetPwd(''); setResetError(''); };

  const submitReset = async () => {
    if (!resetUser) return;
    setResetError('');
    if (resetPwd.length > 0 && resetPwd.length < 4) {
      setResetError(t('users.passwordTooShort'));
      return;
    }
    setResetSaving(true);
    try {
      const res = await fetch(`${API_BASE_URL}/users/${resetUser.id}/password`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: resetPwd || undefined }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setResetError(body?.message || t('users.errorUpdate'));
        return;
      }
      setResetUser(null);
      if (body?.account) setAccountResult(body.account);
    } finally {
      setResetSaving(false);
    }
  };

  const removeUser = async (u: UserRow) => {
    const ok = await confirm({
      title: t('users.delete'),
      message: t('users.confirmDelete', { name: u.nom || u.username }),
      variant: 'danger',
      confirmText: t('users.delete'),
    });
    if (!ok) return;
    const res = await fetch(`${API_BASE_URL}/users/${u.id}`, { method: 'DELETE' });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      await confirm({ message: body?.message || t('users.errorDelete'), confirmText: 'OK', variant: 'warning' });
    }
    load();
  };

  return (
    <div className="page">
      <PageHeader title={t('users.title')} subtitle={t('users.subtitle')}>
        <Button variant="outline" onClick={toggleArchived} style={{ marginRight: 8 }}>
          {showArchived ? t('users.hideArchived', 'Masquer les archives') : t('users.showArchived', 'Voir les archives')}
        </Button>
        <Button onClick={() => { setShowCreate(true); setFormError(''); setDupProfId(null); }}>
          {t('users.add')}
        </Button>
      </PageHeader>

      {error && <div className="login-error" style={{ marginBottom: '1rem' }}>{error}</div>}

      <div className="table-wrapper">
        <table className="table">
          <thead>
            <tr>
              <th>{t('users.name')}</th>
              <th>{t('users.username')}</th>
              <th>{t('users.email', 'Email')}</th>
              <th>{t('users.role')}</th>
              <th>{t('users.status')}</th>
              <th>{t('users.presence', 'Présence')}</th>
              <th>{t('users.confirmation', 'Confirmation')}</th>
              <th>{t('users.lastLogin', 'Dernière connexion')}</th>
              <th style={{ textAlign: 'right' }}>{t('users.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={9} style={{ textAlign: 'center', padding: '1.5rem' }}>…</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={9} style={{ textAlign: 'center', padding: '1.5rem' }}>{t('users.empty')}</td></tr>
            ) : (
              users.map((u) => {
                const isSelf = me?.id === u.id;
                return (
                  <tr key={u.id}>
                    <td>{u.nom || '—'} {isSelf && <span style={{ opacity: 0.6 }}>({t('users.you')})</span>}</td>
                    <td>{u.username}</td>
                    <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>{u.email || '—'}</td>
                    <td style={{ maxWidth: 160 }}>
                      <Select
                        options={roleOptions}
                        value={u.role}
                        fullWidth={false}
                        disabled={isSelf}
                        onChange={(e) => patchUser(u.id, { role: e.target.value as Role })}
                      />
                    </td>
                    <td>
                      <Badge label={u.actif ? t('users.active') : t('users.inactive')} variant={u.actif ? 'success' : 'default'} />
                    </td>
                    <td>
                      <PresenceDot
                        online={isOnline(u.id)}
                        sessions={sessions(u.id)}
                        label={isOnline(u.id) ? t('users.online', 'En ligne') : t('users.offline', 'Hors ligne')}
                        title={!isOnline(u.id) && u.lastLoginAt ? `${t('users.lastLogin', 'Dernière connexion')} : ${fmtDateTime(u.lastLoginAt)}` : undefined}
                      />
                    </td>
                    <td>
                      {u.mustChangePassword ? (
                        <Badge label={t('users.pending', 'En attente')} variant="warning" />
                      ) : (
                        <Badge label={t('users.confirmed', 'Confirmé')} variant="success" />
                      )}
                    </td>
                    <td style={{ whiteSpace: 'nowrap', fontSize: '0.85rem', opacity: 0.8 }}>{fmtDateTime(u.lastLoginAt)}</td>
                    <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <Button variant="outline" size="sm" onClick={() => openEdit(u)} style={{ marginRight: 6 }}>
                        {t('common.modifier', 'Modifier')}
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => openReset(u)} style={{ marginRight: 6 }}>
                        {t('users.resetPassword')}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={isSelf}
                        onClick={() => patchUser(u.id, { actif: !u.actif })}
                        style={{ marginRight: 6 }}
                      >
                        {u.actif ? t('users.deactivate') : t('users.activate')}
                      </Button>
                      <Button variant="danger" size="sm" disabled={isSelf} onClick={() => removeUser(u)}>
                        {t('users.delete')}
                      </Button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {showCreate && (
        <Modal
          title={t('users.createTitle')}
          onClose={() => setShowCreate(false)}
          footer={
            <>
              <Button variant="outline" onClick={() => setShowCreate(false)}>{t('users.cancel')}</Button>
              <Button onClick={submitCreate} loading={saving} disabled={saving}>{t('users.create')}</Button>
            </>
          }
        >
          {formError && (
            <div className="login-error" style={{ marginBottom: '1rem' }}>
              {formError}
              {dupProfId && (
                <div style={{ marginTop: 8 }}>
                  <button
                    type="button"
                    onClick={() => { setShowCreate(false); navigate(`/professeurs/${dupProfId}`); }}
                    style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'inherit', textDecoration: 'underline', fontWeight: 600 }}
                  >
                    {t('users.voirFicheProf', 'Voir la fiche du professeur →')}
                  </button>
                </div>
              )}
            </div>
          )}
          <Select
            label={t('users.role')}
            options={roleOptions}
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value as Role })}
          />
          {form.role === 'professeur' ? (
            <>
              <Input
                label={t('professeurs.form.nom', 'Nom')}
                value={form.nom}
                onChange={(e) => setForm({ ...form, nom: e.target.value })}
              />
              <Input
                label={t('professeurs.form.prenom', 'Prénom')}
                value={form.prenom}
                onChange={(e) => setForm({ ...form, prenom: e.target.value })}
              />
              <Select
                label={t('professeurs.form.genre', 'Genre')}
                value={form.genre}
                onChange={(e) => setForm({ ...form, genre: e.target.value })}
                options={[
                  { value: 'M', label: t('professeurs.genres.masculin', 'Masculin') },
                  { value: 'F', label: t('professeurs.genres.feminin', 'Féminin') },
                ]}
              />
            </>
          ) : (
            <>
              <Input
                label={t('users.username')}
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                autoComplete="off"
              />
              <Input
                label={t('users.name')}
                value={form.nom}
                onChange={(e) => setForm({ ...form, nom: e.target.value })}
              />
            </>
          )}
          <Input
            label={t('users.emailRequired', 'Email *')}
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="prenom.nom@exemple.fr"
            autoComplete="off"
          />
          <p style={{ marginTop: '0.75rem', fontSize: '0.85rem', opacity: 0.7 }}>
            {form.role === 'professeur'
              ? t('users.profCreatedHint', "Le professeur sera ajouté à la liste des professeurs. Son identifiant (= email) et un mot de passe généré lui seront envoyés par email.")
              : t('users.passwordEmailedHint', "L'identifiant et un mot de passe généré seront envoyés par email à l'utilisateur, qui devra le changer à sa première connexion.")}
          </p>
        </Modal>
      )}

      {resetUser && (
        <Modal
          title={t('users.resetTitle', 'Réinitialiser le mot de passe')}
          onClose={() => setResetUser(null)}
          footer={
            <>
              <Button variant="outline" onClick={() => setResetUser(null)}>{t('users.cancel')}</Button>
              <Button onClick={submitReset} loading={resetSaving} disabled={resetSaving}>{t('users.resetPassword')}</Button>
            </>
          }
        >
          {resetError && <div className="login-error" style={{ marginBottom: '1rem' }}>{resetError}</div>}
          <p style={{ marginBottom: '0.75rem' }}>
            {t('users.resetFor', { name: resetUser.nom || resetUser.username, defaultValue: `Compte : ${resetUser.nom || resetUser.username}` })}
          </p>
          <Input
            label={t('users.passwordOptional', 'Nouveau mot de passe (laisser vide = généré automatiquement)')}
            type="password"
            value={resetPwd}
            onChange={(e) => setResetPwd(e.target.value)}
            autoComplete="new-password"
            placeholder="••••••••"
          />
          <p style={{ marginTop: '0.75rem', fontSize: '0.85rem', opacity: 0.7 }}>
            {t('users.resetHint', "Le mot de passe sera envoyé par email si l'utilisateur a une adresse, sinon il s'affichera ici. L'utilisateur devra le changer à sa prochaine connexion.")}
          </p>
        </Modal>
      )}

      {editUser && (
        <Modal
          title={t('users.editTitle', 'Modifier le compte')}
          onClose={() => setEditUser(null)}
          footer={
            <>
              <Button variant="outline" onClick={() => setEditUser(null)}>{t('users.cancel')}</Button>
              <Button onClick={submitEdit} loading={editSaving} disabled={editSaving}>{t('common.enregistrer', 'Enregistrer')}</Button>
            </>
          }
        >
          {editError && <div className="login-error" style={{ marginBottom: '1rem' }}>{editError}</div>}
          <p style={{ marginBottom: '0.75rem', opacity: 0.7 }}>{t('users.username')} : <strong>{editUser.username}</strong></p>
          <Input label={t('users.name')} value={editForm.nom} onChange={(e) => setEditForm((f) => ({ ...f, nom: e.target.value }))} />
          <Input label={t('users.email', 'Email')} type="email" value={editForm.email} onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))} placeholder="prenom.nom@exemple.fr" />
        </Modal>
      )}

      {showArchived && (
        <Modal
          title={t('users.archivedTitle', 'Comptes archivés')}
          onClose={() => setShowArchived(false)}
          maxWidth={620}
          footer={<Button onClick={() => setShowArchived(false)}>{t('common.fermer', 'Fermer')}</Button>}
        >
          {archived.length === 0 ? (
            <p style={{ opacity: 0.7 }}>{t('users.noArchived', 'Aucun compte archivé.')}</p>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>{t('users.name')}</th>
                  <th>{t('users.username')}</th>
                  <th>{t('users.role')}</th>
                  <th style={{ textAlign: 'right' }}>{t('users.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {archived.map((u) => (
                  <tr key={u.id}>
                    <td>{u.nom || '—'}</td>
                    <td>{u.username}</td>
                    <td>{t(`sidebar.roles.${u.role}`)}</td>
                    <td style={{ textAlign: 'right' }}>
                      <Button variant="primary" size="sm" onClick={() => restoreUser(u)}>
                        {t('users.restore', 'Restaurer')}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Modal>
      )}

      {accountResult && (
        <Modal
          title={t('users.accountTitle', 'Compte créé')}
          onClose={() => setAccountResult(null)}
          footer={<Button onClick={() => setAccountResult(null)}>{t('common.fermer', 'Fermer')}</Button>}
        >
          <p style={{ marginBottom: '0.75rem' }}>
            {t('users.username')} : <strong>{accountResult.username}</strong>
          </p>
          {accountResult.emailSent ? (
            <div className="login-info" style={{ color: 'var(--success)' }}>
              {t('users.accountEmailSent', 'Les identifiants ont été envoyés par email.')}
            </div>
          ) : (
            <div className="login-error">
              {t('users.accountNoEmail', "Communiquez ce mot de passe provisoire (à changer à la première connexion) :")}
              <div style={{ marginTop: 8, fontFamily: 'monospace', fontWeight: 600, fontSize: '1.05rem' }}>{accountResult.password}</div>
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}
