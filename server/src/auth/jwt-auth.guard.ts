import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY, JWT_SECRET } from './auth.constants';
import { verifyJwt } from './jwt.util';

/**
 * Guard global : exige un JWT valide sur toutes les routes HTTP,
 * sauf celles marquées `@Public()`. Dépose `req.user` pour la suite.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Ne s'applique qu'au contexte HTTP (les WebSockets sont gérés par la gateway).
    if (context.getType() !== 'http') return true;

    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const req = context.switchToHttp().getRequest();
    const token = this.extractToken(req);
    if (!token) throw new UnauthorizedException('Token manquant');

    try {
      const payload = verifyJwt(token, JWT_SECRET);
      req.user = {
        id: payload.sub,
        username: payload.username,
        role: payload.role,
      };
      return true;
    } catch {
      throw new UnauthorizedException('Token invalide ou expiré');
    }
  }

  /** Accepte l'en-tête `Authorization: Bearer` ou un paramètre `?token=` (téléchargements). */
  private extractToken(req: any): string | null {
    const auth = req.headers?.authorization;
    if (auth && auth.startsWith('Bearer ')) return auth.slice(7);
    if (req.query?.token) return String(req.query.token);
    if (req.query?.access_token) return String(req.query.access_token);
    return null;
  }
}
