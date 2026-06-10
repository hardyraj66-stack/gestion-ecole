import { createHmac, timingSafeEqual } from 'crypto';

/**
 * Implémentation minimale et autonome d'un JWT signé en HS256.
 * Évite toute dépendance externe tout en restant conforme au format JWT standard.
 */

export interface JwtPayload {
  sub: string; // identifiant utilisateur
  username: string;
  role: string;
  /** Fiche Professeur liée (présent si role='professeur'). */
  professeur_id?: string | null;
  /** Version de jeton — comparée à User.tokenVersion pour révoquer les sessions. */
  tv?: number;
  iat?: number;
  exp?: number;
}

function base64url(input: Buffer | string): string {
  return Buffer.from(input).toString('base64url');
}

export function signJwt(
  payload: Omit<JwtPayload, 'iat' | 'exp'>,
  secret: string,
  expiresInSec: number,
): string {
  const header = base64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const now = Math.floor(Date.now() / 1000);
  const body = base64url(
    JSON.stringify({ ...payload, iat: now, exp: now + expiresInSec }),
  );
  const data = `${header}.${body}`;
  const signature = createHmac('sha256', secret).update(data).digest('base64url');
  return `${data}.${signature}`;
}

export function verifyJwt(token: string, secret: string): JwtPayload {
  const parts = token.split('.');
  if (parts.length !== 3) throw new Error('Token malformé');
  const [header, body, signature] = parts;

  const expected = createHmac('sha256', secret)
    .update(`${header}.${body}`)
    .digest('base64url');
  const sigBuf = Buffer.from(signature);
  const expBuf = Buffer.from(expected);
  if (sigBuf.length !== expBuf.length || !timingSafeEqual(sigBuf, expBuf)) {
    throw new Error('Signature invalide');
  }

  const payload = JSON.parse(
    Buffer.from(body, 'base64url').toString(),
  ) as JwtPayload;
  if (payload.exp && Math.floor(Date.now() / 1000) > payload.exp) {
    throw new Error('Token expiré');
  }
  return payload;
}
