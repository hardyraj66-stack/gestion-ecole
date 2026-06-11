import { randomBytes, scryptSync, timingSafeEqual } from 'crypto';
import { BadRequestException } from '@nestjs/common';

/** Longueur minimale d'un mot de passe. */
export const PASSWORD_MIN_LENGTH = 8;

/**
 * Vérifie la robustesse d'un mot de passe : au moins 8 caractères,
 * contenant au moins une lettre et un chiffre. Lève une 400 sinon.
 */
export function validatePasswordStrength(password: string): void {
  if (!password || password.length < PASSWORD_MIN_LENGTH) {
    throw new BadRequestException(
      `Mot de passe trop court (${PASSWORD_MIN_LENGTH} caractères minimum).`,
    );
  }
  if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
    throw new BadRequestException(
      'Le mot de passe doit contenir au moins une lettre et un chiffre.',
    );
  }
}

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

/**
 * Génère un mot de passe aléatoire lisible (sans caractères ambigus comme 0/O/1/l).
 * Utilisé pour les comptes professeur créés par l'administration.
 */
export function generatePassword(length = 10): string {
  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz';
  const digits = '23456789';
  const alphabet = letters + digits;
  const len = Math.max(length, PASSWORD_MIN_LENGTH);
  const bytes = randomBytes(len + 2);
  const chars: string[] = [];
  // Garantir au moins une lettre et un chiffre (politique min lettre+chiffre).
  chars.push(letters[bytes[0] % letters.length]);
  chars.push(digits[bytes[1] % digits.length]);
  for (let i = 0; i < len - 2; i++) chars.push(alphabet[bytes[i + 2] % alphabet.length]);
  // Mélange (Fisher-Yates) pour ne pas figer la position de la lettre/du chiffre.
  for (let i = chars.length - 1; i > 0; i--) {
    const j = randomBytes(1)[0] % (i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join('');
}
