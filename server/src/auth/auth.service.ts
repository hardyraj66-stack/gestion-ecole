import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { verifyPassword } from './password.util';
import { signJwt } from './jwt.util';
import { JWT_SECRET, JWT_EXPIRES_IN_SEC } from './auth.constants';

@Injectable()
export class AuthService {
  constructor(private usersService: UsersService) {}

  async login(username: string, password: string) {
    if (!username || !password) {
      throw new UnauthorizedException('Identifiant et mot de passe requis');
    }
    const user = await this.usersService.findByUsername(username);
    // Message volontairement générique pour ne pas révéler l'existence du compte.
    if (!user || !user.actif || !verifyPassword(password, user.passwordHash)) {
      throw new UnauthorizedException('Identifiants invalides');
    }
    const access_token = signJwt(
      { sub: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      JWT_EXPIRES_IN_SEC,
    );
    return { access_token, user: user.toJSON() };
  }

  async me(userId: string) {
    const user = await this.usersService.findById(userId);
    if (!user) throw new UnauthorizedException('Utilisateur introuvable');
    return user.toJSON();
  }

  async changePassword(userId: string, current: string, next: string) {
    if (!current || !next) {
      throw new BadRequestException('Mot de passe actuel et nouveau requis');
    }
    const user = await this.usersService.findById(userId);
    if (!user) throw new UnauthorizedException('Utilisateur introuvable');
    if (!verifyPassword(current, user.passwordHash)) {
      throw new BadRequestException('Mot de passe actuel incorrect');
    }
    await this.usersService.setPassword(userId, next);
    return { ok: true };
  }
}
