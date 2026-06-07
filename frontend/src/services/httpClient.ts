import { API_BASE_URL } from '../config/api';
import { getToken } from './authStorage';

/**
 * Intercepteur global de `window.fetch`.
 *
 * - Ajoute automatiquement `Authorization: Bearer <token>` à toute requête
 *   vers l'API, sans avoir à modifier les ~80 appels `fetch` existants.
 * - Déclenche `onUnauthorized` sur une réponse 401 (token expiré/invalide)
 *   pour forcer la déconnexion côté UI.
 *
 * Le patch est appliqué dès l'import du module (à charger tôt dans main.tsx).
 */

type Handler = () => void;
let unauthorizedHandler: Handler | null = null;

export function setUnauthorizedHandler(fn: Handler | null): void {
  unauthorizedHandler = fn;
}

const originalFetch = window.fetch.bind(window);

window.fetch = async (
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> => {
  const url =
    typeof input === 'string'
      ? input
      : input instanceof URL
        ? input.href
        : (input as Request).url;
  const isApi = typeof url === 'string' && url.startsWith(API_BASE_URL);

  let finalInit = init;
  // N'injecte l'en-tête que pour les appels API par URL (couvre 100 % des appels du projet).
  if (isApi && !(input instanceof Request)) {
    const token = getToken();
    if (token) {
      const headers = new Headers(init?.headers);
      if (!headers.has('Authorization')) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      finalInit = { ...init, headers };
    }
  }

  const res = await originalFetch(input as RequestInfo | URL, finalInit);

  // 401 = session invalide → déconnexion (sauf sur la tentative de login elle-même).
  if (
    isApi &&
    res.status === 401 &&
    unauthorizedHandler &&
    !url.includes('/auth/login')
  ) {
    unauthorizedHandler();
  }
  return res;
};
