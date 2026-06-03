import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { API_BASE_URL } from '../../config/api';
import { useAuth, Role } from '../../contexts/AuthContext';
import { useConfirm } from '../../components/shared/ConfirmDialog';
import { PageHeader } from '../../components/ui/PageHeader';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/shared/Button';
import { Input } from '../../components/shared/Input';
import { Select } from '../../components/shared/Select';
import { Modal } from '../../components/shared/Modal';

interface UserRow {
  id: string;
  username: string;
  nom: string;
  role: Role;
  actif: boolean;
}

const ROLE_VARIANT: Record<Role, 'success' | 'info' | 'warning'> = {
  admin: 'success',
  secretaire: 'info',
  professeur: 'warning',
};

export function UsersList() {
  const { t } = useTranslation();
  const confirm = useConfirm();
  const { user: me } = useAuth();

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
  const [form, setForm] = useState({ username: '', nom: '', role: 'secretaire' as Role, password: '' });
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const submitCreate = async () => {
    setFormError('');
    if (!form.username.trim() || form.password.length < 4) {
      setFormError(t('users.formInvalid'));
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE_URL}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setFormError(body?.message || t('users.errorCreate'));
        return;
      }
      setShowCreate(false);
      setForm({ username: '', nom: '', role: 'secretaire', password: '' });
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

  const resetPassword = async (u: UserRow) => {
    const pwd = window.prompt(t('users.newPasswordPrompt', { name: u.nom || u.username }));
    if (pwd == null) return;
    if (pwd.length < 4) {
      await confirm({ message: t('users.passwordTooShort'), confirmText: 'OK', variant: 'warning' });
      return;
    }
    const res = await fetch(`${API_BASE_URL}/users/${u.id}/password`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: pwd }),
    });
    if (res.ok) {
      await confirm({ message: t('users.passwordChanged'), confirmText: 'OK', variant: 'info' });
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
        <Button onClick={() => { setShowCreate(true); setFormError(''); }}>
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
              <th>{t('users.role')}</th>
              <th>{t('users.status')}</th>
              <th style={{ textAlign: 'right' }}>{t('users.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} style={{ textAlign: 'center', padding: '1.5rem' }}>…</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={5} style={{ textAlign: 'center', padding: '1.5rem' }}>{t('users.empty')}</td></tr>
            ) : (
              users.map((u) => {
                const isSelf = me?.id === u.id;
                return (
                  <tr key={u.id}>
                    <td>{u.nom || '—'} {isSelf && <span style={{ opacity: 0.6 }}>({t('users.you')})</span>}</td>
                    <td>{u.username}</td>
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
                    <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <Button variant="outline" size="sm" onClick={() => resetPassword(u)} style={{ marginRight: 6 }}>
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
          {formError && <div className="login-error" style={{ marginBottom: '1rem' }}>{formError}</div>}
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
          <Select
            label={t('users.role')}
            options={roleOptions}
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value as Role })}
          />
          <Input
            label={t('users.passwordLabel')}
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            autoComplete="new-password"
          />
        </Modal>
      )}
    </div>
  );
}
