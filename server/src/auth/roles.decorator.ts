import { SetMetadata } from '@nestjs/common';
import { ROLES_KEY, Role } from './auth.constants';

/** Restreint une route (ou un contrôleur entier) aux rôles indiqués. */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
