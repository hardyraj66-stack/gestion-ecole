import { useTranslation } from 'react-i18next';
import { useSettings } from '../../contexts/SettingsContext';
import { AppSettings } from '../../services/settingsDB';

const COLOR_OPTIONS: { value: AppSettings['color']; hex: string }[] = [
  { value: 'blue',   hex: '#2563eb' },
  { value: 'violet', hex: '#7c3aed' },
  { value: 'green',  hex: '#16a34a' },
  { value: 'red',    hex: '#dc2626' },
  { value: 'orange', hex: '#ea580c' },
  { value: 'indigo', hex: '#4f46e5' },
];

const LANG_OPTIONS: { value: AppSettings['language']; flag: string }[] = [
  { value: 'fr', flag: '🇫🇷' },
  { value: 'en', flag: '🇬🇧' },
  { value: 'mg', flag: '🇲🇬' },
];

export function Parametres() {
  const { t } = useTranslation();
  const { settings, setTheme, setColor, setLanguage } = useSettings();

  return (
    <div className="page-content">
      <div className="page-header" style={{ marginBottom: '1.5rem' }}>
        <div>
          <h1 className="page-title">{t('parametres.titre')}</h1>
          <p className="page-subtitle">{t('parametres.sousTitre')}</p>
        </div>
      </div>

      <div className="settings-page">
        {/* Apparence */}
        <div className="settings-section">
          <div className="settings-section-title">{t('parametres.apparence.titre')}</div>

          {/* Mode clair/sombre */}
          <div className="settings-row">
            <div>
              <div className="settings-label">{t('parametres.apparence.mode')}</div>
              <div className="settings-description">
                {settings.theme === 'dark' ? t('parametres.apparence.sombre') : t('parametres.apparence.clair')}
              </div>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={settings.theme === 'dark'}
                onChange={(e) => setTheme(e.target.checked ? 'dark' : 'light')}
              />
              <span className="toggle-slider" />
            </label>
          </div>

          {/* Couleur du thème */}
          <div style={{ paddingTop: '1rem', borderTop: '1px solid var(--border)', marginTop: '0.75rem' }}>
            <div className="settings-label">{t('parametres.apparence.couleur')}</div>
            <div className="color-swatches">
              {COLOR_OPTIONS.map((opt) => (
                <div key={opt.value} style={{ textAlign: 'center' }}>
                  <button
                    className={`color-swatch${settings.color === opt.value ? ' active' : ''}`}
                    style={{ background: opt.hex }}
                    onClick={() => setColor(opt.value)}
                    title={t(`parametres.apparence.couleurs.${opt.value}`)}
                    aria-label={t(`parametres.apparence.couleurs.${opt.value}`)}
                  />
                  <div className="color-swatch-label">
                    {t(`parametres.apparence.couleurs.${opt.value}`)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Langue */}
        <div className="settings-section">
          <div className="settings-section-title">{t('parametres.langue.titre')}</div>
          <div className="settings-description" style={{ marginBottom: '0.25rem' }}>
            {t('parametres.langue.description')}
          </div>
          <div className="lang-buttons">
            {LANG_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                className={`lang-btn${settings.language === opt.value ? ' active' : ''}`}
                onClick={() => setLanguage(opt.value)}
              >
                <span style={{ fontSize: '1.2rem' }}>{opt.flag}</span>
                <span>{t(`parametres.langue.${opt.value}`)}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
