import { randomBytes, scryptSync, timingSafeEqual } from 'crypto';

/**
 * Hachage de mot de passe basé sur scrypt (intégré à Node, aucune dépendance).
 * Format stocké : `<salt_hex>:<hash_hex>`.
 */
export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const derived = scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${derived}`;
}

/** Vérification à temps constant pour éviter les attaques temporelles. */
export function verifyPassword(password: string, stored: string): boolean {
  if (!stored || !stored.includes(':')) return false;
  const [salt, key] = stored.split(':');
  const keyBuf = Buffer.from(key, 'hex');
  const derived = scryptSync(password, salt, 64);
  return keyBuf.length === derived.length && timingSafeEqual(keyBuf, derived);
}
