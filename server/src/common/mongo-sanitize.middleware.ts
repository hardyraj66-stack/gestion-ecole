import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

/**
 * Neutralise les tentatives d'injection d'opérateurs MongoDB.
 *
 * Mongoose interprète les objets imbriqués comme des opérateurs : un payload
 * tel que `{ "username": { "$ne": null } }` ou une clé en notation pointée
 * (`"a.b"`) peut détourner une requête. Comme l'application n'utilise aucune
 * clé commençant par `$` ni contenant `.`, on les supprime récursivement de
 * `body`, `query` et `params` — sans dépendance (équivalent maison de
 * `express-mongo-sanitize`).
 */
const FORBIDDEN_KEY = /^\$|\./;
const MAX_DEPTH = 8;

function sanitize(value: unknown, depth = 0): void {
  if (!value || typeof value !== 'object' || depth > MAX_DEPTH) return;
  if (Array.isArray(value)) {
    for (const item of value) sanitize(item, depth + 1);
    return;
  }
  const obj = value as Record<string, unknown>;
  for (const key of Object.keys(obj)) {
    if (FORBIDDEN_KEY.test(key)) {
      delete obj[key];
      continue;
    }
    sanitize(obj[key], depth + 1);
  }
}

@Injectable()
export class MongoSanitizeMiddleware implements NestMiddleware {
  use(req: Request, _res: Response, next: NextFunction) {
    // Mutation en place : req.query/params sont des objets simples (Express 4).
    sanitize(req.body);
    sanitize(req.query);
    sanitize(req.params);
    next();
  }
}
