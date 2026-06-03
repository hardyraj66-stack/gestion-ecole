import { FormEvent, useState } from 'react';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { Input } from '../../components/shared/Input';
import { Button } from '../../components/shared/Button';
import { BrandIcon } from '../../components/brand/BrandIcon';
import { BrandWordmark } from '../../components/brand/BrandWordmark';
import './Login.css';

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
        <div className="login-brand">
          <BrandIcon size={48} />
          <BrandWordmark height={30} />
          <p className="login-subtitle">{t('login.subtitle')}</p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          {error && <div className="login-error">{error}</div>}

          <Input
            label={t('login.username')}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoFocus
            autoComplete="username"
            placeholder={t('login.usernamePlaceholder')}
          />
          <Input
            label={t('login.password')}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
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
