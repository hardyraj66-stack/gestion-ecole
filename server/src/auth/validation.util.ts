import { BadRequestException } from '@nestjs/common';

/** Validation de format d'email volontairement simple (sans dépendance). */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(email: string): boolean {
  return typeof email === 'string' && EMAIL_RE.test(email.trim());
}

/** Lève une 400 si l'email est absent ou mal formé. */
export function assertValidEmail(email: string): void {
  if (!isValidEmail(email)) {
    throw new BadRequestException("L'email est invalide.");
  }
}
