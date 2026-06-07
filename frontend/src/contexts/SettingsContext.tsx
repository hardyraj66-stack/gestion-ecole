import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { loadSettings, saveSettings, AppSettings } from '../services/settingsDB';
import i18n from '../i18n/index';

interface SettingsContextType {
  settings: AppSettings;
  ready: boolean;
  setTheme: (theme: AppSettings['theme']) => void;
  setColor: (color: AppSettings['color']) => void;
  setLanguage: (language: AppSettings['language']) => void;
}

const SettingsContext = createContext<SettingsContextType | null>(null);

function applyTheme(theme: AppSettings['theme']) {
  document.documentElement.setAttribute('data-theme', theme);
}

function applyColor(color: AppSettings['color']) {
  document.documentElement.setAttribute('data-color', color);
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>({
    theme: 'light',
    color: 'blue',
    language: 'fr',
  });
  const [ready, setReady] = useState(false);

  useEffect(() => {
    loadSettings().then((saved) => {
      setSettings(saved);
      applyTheme(saved.theme);
      applyColor(saved.color);
      i18n.changeLanguage(saved.language);
      setReady(true);
    });
  }, []);

  function setTheme(theme: AppSettings['theme']) {
    const next = { ...settings, theme };
    setSettings(next);
    applyTheme(theme);
    saveSettings({ theme });
  }

  function setColor(color: AppSettings['color']) {
    const next = { ...settings, color };
    setSettings(next);
    applyColor(color);
    saveSettings({ color });
  }

  function setLanguage(language: AppSettings['language']) {
    const next = { ...settings, language };
    setSettings(next);
    i18n.changeLanguage(language);
    saveSettings({ language });
  }

  if (!ready) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg)' }}>
        <div style={{ width: 32, height: 32, border: '3px solid var(--border)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
      </div>
    );
  }

  return (
    <SettingsContext.Provider value={{ settings, ready, setTheme, setColor, setLanguage }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings(): SettingsContextType {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider');
  return ctx;
}
