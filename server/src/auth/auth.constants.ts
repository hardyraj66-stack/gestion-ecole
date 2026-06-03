/**
 * Constantes et types de l'authentification.
 * Le secret JWT et l'admin par défaut sont surchargeables via variables d'environnement.
 */
export const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me-gestion-ecole';
export const JWT_EXPIRES_IN_SEC = 60 * 60 * 12; // 12 heures

export const IS_PUBLIC_KEY = 'isPublic';
export const ROLES_KEY = 'roles';

export type Role = 'admin' | 'professeur' | 'secretaire';
export const ROLES: Role[] = ['admin', 'professeur', 'secretaire'];
