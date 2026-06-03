import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Injecte l'utilisateur authentifié (déposé par JwtAuthGuard) dans un handler.
 * `@CurrentUser()` renvoie l'objet complet, `@CurrentUser('id')` un champ précis.
 */
export const CurrentUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const req = ctx.switchToHttp().getRequest();
    return data ? req.user?.[data] : req.user;
  },
);
