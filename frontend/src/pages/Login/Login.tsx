import { FormEvent, useState } from 'react';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { Input } from '../../components/shared/Input';
import { Button } from '../../components/shared/Button';
import { Logo } from '../../components/brand/Logo';
import './Login.css';

const UserIcon = (
  <svg width="17" height="17" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

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

export function Login() {
  const { t } = useTranslation();
  const { login, status, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const from = (location.state as { from?: { pathname: string } } | null)?.from?.pathname || '/dashboard';

  // Déjà connecté → redirige hors de la page de login.
  if (status === 'authenticated' && isAuthenticated) {
    return <Navigate to={from} replace />;
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    const res = await login(username.trim(), password);
    setSubmitting(false);
    if (res.ok) {
      navigate(from, { replace: true });
    } else {
      setError(res.error || t('login.error'));
    }
  };

  return (
    <div className="login-screen">
      <div className="login-card">
        <div className="login-header">
          <Logo iconSize={54} layout="vertical" tone="onLight" />
          <p className="login-subtitle">{t('login.subtitle')}</p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          {error && (
            <div className="login-error">
              {AlertIcon}
              <span>{error}</span>
            </div>
          )}

          <Input
            label={t('login.username')}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            icon={UserIcon}
            autoFocus
            autoComplete="username"
            placeholder={t('login.usernamePlaceholder')}
          />
          <Input
            label={t('login.password')}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            icon={LockIcon}
            autoComplete="current-password"
            placeholder="••••••••"
          />

          <Button type="submit" fullWidth loading={submitting} disabled={submitting}>
            {t('login.submit')}
          </Button>
        </form>
      </div>
    </div>
  );
}
