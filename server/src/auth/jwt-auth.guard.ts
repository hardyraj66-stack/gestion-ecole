import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY, JWT_SECRET } from './auth.constants';
import { verifyJwt } from './jwt.util';
import { UsersService } from '../users/users.service';

/**
 * Guard global : exige un JWT valide sur toutes les routes HTTP,
 * sauf celles marquées `@Public()`. Vérifie aussi en base que le compte
 * est toujours actif et que la version de jeton correspond (révocation).
 * Dépose `req.user` pour la suite.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private usersService: UsersService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
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

    let payload;
    try {
      payload = verifyJwt(token, JWT_SECRET);
    } catch {
      throw new UnauthorizedException('Token invalide ou expiré');
    }

    // Vérification en base : compte actif/non archivé + version de jeton à jour.
    const user = await this.usersService.findById(payload.sub);
    if (
      !user ||
      !user.actif ||
      (user as any).deleted ||
      (user as any).tokenVersion !== (payload.tv ?? 0)
    ) {
      throw new UnauthorizedException('Session expirée ou révoquée');
    }

    req.user = {
      id: user.id,
      username: user.username,
      role: user.role,
      professeur_id: (user as any).professeur_id ?? null,
    };
    return true;
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
