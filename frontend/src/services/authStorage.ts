/**
 * Stockage du jeton de session dans localStorage.
 * Source de vérité unique pour le token, lue à la fois par l'intercepteur fetch,
 * le service socket et le contexte d'authentification.
 */
const TOKEN_KEY = 'auth_token';

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token: string): void {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {
    /* stockage indisponible — ignoré */
  }
}

export function clearToken(): void {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* ignoré */
  }
}
