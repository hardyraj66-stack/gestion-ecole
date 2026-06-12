import {
  HttpException,
  HttpStatus,
  Injectable,
  NestMiddleware,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

/**
 * Limiteur de débit ciblé sur les routes d'authentification sensibles
 * (connexion, mot de passe oublié, réinitialisation), par adresse IP.
 *
 * Volontairement **limité aux routes d'auth** : un établissement partage souvent
 * une seule IP publique, un limiteur global pénaliserait des utilisateurs
 * légitimes. La protection anti brute-force par identifiant (AuthService) reste
 * la première ligne ; ce limiteur ajoute une barrière contre l'énumération et
 * les attaques distribuées. Fenêtre glissante en mémoire, sans dépendance.
 */
const WINDOW_MS = 5 * 60 * 1000; // 5 minutes
const MAX_HITS = 30; // par IP et par fenêtre
const SENSITIVE = ['/auth/login', '/auth/forgot-password', '/auth/reset-password'];

@Injectable()
export class AuthRateLimitMiddleware implements NestMiddleware {
  private readonly hits = new Map<string, number[]>();

  use(req: Request, _res: Response, next: NextFunction) {
    const path = req.path || req.url || '';
    // Robuste au préfixe global /api (prod) : on teste par inclusion.
    if (!SENSITIVE.some((p) => path.includes(p))) return next();

    const ip =
      ((req.headers['x-forwarded-for'] as string) || req.ip || '')
        .toString()
        .split(',')[0]
        .trim() || 'unknown';
    const now = Date.now();

    const recent = (this.hits.get(ip) || []).filter((t) => now - t < WINDOW_MS);
    recent.push(now);
    this.hits.set(ip, recent);

    // Nettoyage paresseux pour borner la mémoire.
    if (this.hits.size > 5000) {
      for (const [k, v] of this.hits) {
        if (!v.some((t) => now - t < WINDOW_MS)) this.hits.delete(k);
      }
    }

    if (recent.length > MAX_HITS) {
      throw new HttpException(
        'Trop de tentatives. Réessayez dans quelques minutes.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
    next();
  }
}
