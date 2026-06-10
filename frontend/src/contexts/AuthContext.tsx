import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { API_BASE_URL } from '../config/api';
import { getToken, setToken, clearToken } from '../services/authStorage';
import { setUnauthorizedHandler } from '../services/httpClient';
import { notifyAuthChanged } from '../services/socketService';

export type Role = 'admin' | 'professeur' | 'secretaire';

export interface AuthUser {
  id: string;
  username: string;
  nom: string;
  email?: string;
  role: Role;
  actif?: boolean;
  /** Forcer le changement de mot de passe à la première connexion. */
  mustChangePassword?: boolean;
  lastLoginAt?: string | null;
}

type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

interface AuthContextValue {
  user: AuthUser | null;
  status: AuthStatus;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => void;
  logoutAll: () => Promise<void>;
  changePassword: (current: string, next: string) => Promise<{ ok: boolean; error?: string }>;
  updateProfile: (data: { nom?: string; email?: string }) => Promise<{ ok: boolean; error?: string }>;
  hasRole: (...roles: Role[]) => boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [status, setStatus] = useState<AuthStatus>('loading');

  const logout = useCallback(() => {
    clearToken();
    setUser(null);
    setStatus('unauthenticated');
    notifyAuthChanged();
  }, []);

  // Hydratation au démarrage : vérifie le token existant via /auth/me.
  useEffect(() => {
    setUnauthorizedHandler(() => logout());

    const token = getToken();
    if (!token) {
      setStatus('unauthenticated');
      return () => setUnauthorizedHandler(null);
    }

    let cancelled = false;
    fetch(`${API_BASE_URL}/auth/me`)
      .then(async (r) => {
        if (cancelled) return;
        if (r.ok) {
          const u = (await r.json()) as AuthUser;
          setUser(u);
          setStatus('authenticated');
          notifyAuthChanged();
        } else {
          clearToken();
          setStatus('unauthenticated');
        }
      })
      .catch(() => {
        if (cancelled) return;
        clearToken();
        setStatus('unauthenticated');
      });

    return () => {
      cancelled = true;
      setUnauthorizedHandler(null);
    };
  }, [logout]);

  const login = useCallback(async (username: string, password: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        return { ok: false, error: body?.message || 'Identifiants invalides' };
      }
      const data = await res.json();
      setToken(data.access_token);
      setUser(data.user as AuthUser);
      setStatus('authenticated');
      notifyAuthChanged();
      return { ok: true };
    } catch {
      return { ok: false, error: 'Serveur injoignable' };
    }
  }, []);

  const changePassword = useCallback(async (current: string, next: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/change-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ current, next }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        return { ok: false, error: body?.message || 'Échec du changement' };
      }
      // Le serveur a invalidé les autres sessions (tokenVersion++) et renvoie un
      // nouveau jeton pour garder la session courante valide.
      if (body?.access_token) setToken(body.access_token);
      // Le flag mustChangePassword est levé côté serveur → débloquer l'app.
      setUser((prev) => (prev ? { ...prev, mustChangePassword: false } : prev));
      return { ok: true };
    } catch {
      return { ok: false, error: 'Serveur injoignable' };
    }
  }, []);

  const updateProfile = useCallback(async (data: { nom?: string; email?: string }) => {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/me`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        return { ok: false, error: body?.message || 'Échec de la mise à jour' };
      }
      setUser((prev) => (prev ? { ...prev, ...(body as AuthUser) } : prev));
      return { ok: true };
    } catch {
      return { ok: false, error: 'Serveur injoignable' };
    }
  }, []);

  const logoutAll = useCallback(async () => {
    try {
      await fetch(`${API_BASE_URL}/auth/logout-all`, { method: 'POST' });
    } catch {
      /* ignoré */
    }
    logout();
  }, [logout]);

  const hasRole = useCallback(
    (...roles: Role[]) => !!user && roles.includes(user.role),
    [user],
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        status,
        isAuthenticated: status === 'authenticated' && !!user,
        login,
        logout,
        logoutAll,
        changePassword,
        updateProfile,
        hasRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth doit être utilisé dans un AuthProvider');
  return ctx;
}
