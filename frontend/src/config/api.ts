// En développement : le backend tourne sur localhost:3000 (Vite sur 5173).
// En production : le frontend est servi par le backend (même origine). L'API est
// exposée sous le préfixe /api, et Socket.IO reste sur la racine (/socket.io).
const PROD = import.meta.env.PROD;
const origin = typeof window !== 'undefined' ? window.location.origin : '';

export const API_BASE_URL = PROD ? `${origin}/api` : 'http://localhost:3000';
export const SOCKET_URL = PROD ? origin : 'http://localhost:3000';
