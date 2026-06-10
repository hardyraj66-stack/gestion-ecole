import { FormEvent, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { API_BASE_URL } from '../../config/api';
import { Input } from '../../components/shared/Input';
import { Button } from '../../components/shared/Button';
import { Logo } from '../../components/brand/Logo';
import './Login.css';

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

export function ResetPassword() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const token = params.get('token') || '';

  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (next.length < 8) {
      setError(t('password.tooShort', 'Le mot de passe doit contenir au moins 8 caractères (dont une lettre et un chiffre).'));
      return;
    }
    if (next !== confirm) {
      setError(t('password.mismatch', 'Les deux mots de passe ne correspondent pas.'));
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE_URL}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password: next }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(body?.message || t('password.error', 'Échec de la réinitialisation.'));
        return;
      }
      setDone(true);
    } catch {
      setError(t('login.serverError', 'Serveur injoignable'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="login-screen">
      <div className="login-card">
        <div className="login-header">
          <Logo iconSize={54} layout="vertical" tone="onLight" />
          <p className="login-subtitle">{t('reset.subtitle', 'Définir un nouveau mot de passe')}</p>
        </div>

        {!token ? (
          <div className="login-error">{AlertIcon}<span>{t('reset.noToken', 'Lien invalide.')}</span></div>
        ) : done ? (
          <form className="login-form" onSubmit={(e) => { e.preventDefault(); navigate('/login'); }}>
            <div className="login-info" style={{ color: 'var(--success)' }}>
              {t('reset.success', 'Mot de passe modifié. Vous pouvez vous connecter.')}
            </div>
            <Button type="submit" fullWidth>{t('reset.toLogin', 'Aller à la connexion')}</Button>
          </form>
        ) : (
          <form className="login-form" onSubmit={handleSubmit}>
            {error && <div className="login-error">{AlertIcon}<span>{error}</span></div>}
            <Input
              label={t('password.new', 'Nouveau mot de passe')}
              type="password"
              value={next}
              onChange={(e) => setNext(e.target.value)}
              icon={LockIcon}
              autoComplete="new-password"
              placeholder="••••••••"
              autoFocus
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
              {t('reset.submit', 'Réinitialiser')}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
