import { FormEvent, ReactNode, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { Input } from '../shared/Input';
import { Button } from '../shared/Button';
import { Logo } from '../brand/Logo';
import '../../pages/Login/Login.css';

const LockIcon = (
  <svg width="17" height="17" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <rect x="5" y="11" width="14" height="10" rx="2" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 11V7a4 4 0 118 0v4" />
  </svg>
);

const AlertIcon = (
  <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ flexShrink: 0 }}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
  </svg>
);

/**
 * Bloque l'accès à l'application tant qu'un utilisateur marqué `mustChangePassword`
 * (typiquement un professeur à sa première connexion) n'a pas défini un nouveau
 * mot de passe. Sinon, affiche l'application normalement.
 */
export function PasswordGate({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  const { user, changePassword, logout } = useAuth();

  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!user?.mustChangePassword) return <>{children}</>;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (next.length < 4) {
      setError(t('password.tooShort', 'Le mot de passe doit contenir au moins 4 caractères.'));
      return;
    }
    if (next !== confirm) {
      setError(t('password.mismatch', 'Les deux mots de passe ne correspondent pas.'));
      return;
    }
    setSubmitting(true);
    const res = await changePassword(current, next);
    setSubmitting(false);
    if (!res.ok) setError(res.error || t('password.error', 'Échec du changement de mot de passe.'));
  };

  return (
    <div className="login-screen">
      <div className="login-card">
        <div className="login-header">
          <Logo iconSize={54} layout="vertical" tone="onLight" />
          <p className="login-subtitle">
            {t('password.firstLoginPrompt', 'Pour votre sécurité, veuillez définir un nouveau mot de passe.')}
          </p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          {error && (
            <div className="login-error">
              {AlertIcon}
              <span>{error}</span>
            </div>
          )}

          <Input
            label={t('password.current', 'Mot de passe actuel')}
            type="password"
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
            icon={LockIcon}
            autoComplete="current-password"
            placeholder="••••••••"
            autoFocus
          />
          <Input
            label={t('password.new', 'Nouveau mot de passe')}
            type="password"
            value={next}
            onChange={(e) => setNext(e.target.value)}
            icon={LockIcon}
            autoComplete="new-password"
            placeholder="••••••••"
          />
          <Input
            label={t('password.confirm', 'Confirmer le nouveau mot de passe')}
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            icon={LockIcon}
            autoComplete="new-password"
            placeholder="••••••••"
          />

          <Button type="submit" fullWidth loading={submitting} disabled={submitting}>
            {t('password.submit', 'Définir le mot de passe')}
          </Button>
          <button type="button" className="login-link-btn" onClick={logout} style={{ background: 'none', border: 'none', cursor: 'pointer', marginTop: '0.5rem', color: 'var(--text-muted)' }}>
            {t('sidebar.logout', 'Se déconnecter')}
          </button>
        </form>
      </div>
    </div>
  );
}
