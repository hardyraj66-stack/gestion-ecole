import { FormEvent, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { Input } from '../shared/Input';
import { Button } from '../shared/Button';

/**
 * Section réutilisable « changer son mot de passe » (Paramètres + Mon profil).
 * Applique côté UI les règles minimales ; le serveur valide la robustesse.
 */
export function ChangePasswordSection() {
  const { t } = useTranslation();
  const { changePassword } = useAuth();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'ok' | 'error'; msg: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    if (next.length < 8) {
      setFeedback({ type: 'error', msg: t('password.tooShort', 'Le mot de passe doit contenir au moins 8 caractères (dont une lettre et un chiffre).') });
      return;
    }
    if (next !== confirm) {
      setFeedback({ type: 'error', msg: t('password.mismatch', 'Les deux mots de passe ne correspondent pas.') });
      return;
    }
    setSubmitting(true);
    const res = await changePassword(current, next);
    setSubmitting(false);
    if (res.ok) {
      setFeedback({ type: 'ok', msg: t('password.success', 'Mot de passe modifié.') });
      setCurrent(''); setNext(''); setConfirm('');
    } else {
      setFeedback({ type: 'error', msg: res.error || t('password.error', 'Échec du changement de mot de passe.') });
    }
  };

  return (
    <div className="settings-section">
      <div className="settings-section-title">{t('password.sectionTitle', 'Mot de passe')}</div>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxWidth: 360 }}>
        <Input label={t('password.current', 'Mot de passe actuel')} type="password" value={current} onChange={(e) => setCurrent(e.target.value)} autoComplete="current-password" />
        <Input label={t('password.new', 'Nouveau mot de passe')} type="password" value={next} onChange={(e) => setNext(e.target.value)} autoComplete="new-password" />
        <Input label={t('password.confirm', 'Confirmer le nouveau mot de passe')} type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" />
        {feedback && (
          <div className="settings-description" style={{ color: feedback.type === 'ok' ? 'var(--success)' : 'var(--danger, #dc2626)' }}>
            {feedback.msg}
          </div>
        )}
        <Button type="submit" loading={submitting} disabled={submitting || !current || !next}>
          {t('password.submit', 'Modifier le mot de passe')}
        </Button>
      </form>
    </div>
  );
}
