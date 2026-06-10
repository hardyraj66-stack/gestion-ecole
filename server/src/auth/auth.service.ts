import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { createHash, randomBytes } from 'crypto';
import { UsersService } from '../users/users.service';
import { MailService } from '../mail/mail.service';
import { verifyPassword } from './password.util';
import { signJwt } from './jwt.util';
import { JWT_SECRET, JWT_EXPIRES_IN_SEC, APP_URL } from './auth.constants';

const MAX_LOGIN_FAILS = 5;
const LOGIN_LOCK_MS = 15 * 60 * 1000; // 15 minutes
const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 heure

function sha256(input: string): string {
  return createHash('sha256').update(input).digest('hex');
}

@Injectable()
export class AuthService {
  // Anti brute-force : compteur d'échecs en mémoire par identifiant.
  private readonly attempts = new Map<string, { fails: number; lockedUntil: number }>();

  constructor(
    private usersService: UsersService,
    private mailService: MailService,
  ) {}

  /** Signe un jeton pour un utilisateur (inclut la version de jeton courante). */
  private signFor(user: any): string {
    return signJwt(
      {
        sub: user.id,
        username: user.username,
        role: user.role,
        professeur_id: user.professeur_id ?? null,
        tv: user.tokenVersion ?? 0,
      },
      JWT_SECRET,
      JWT_EXPIRES_IN_SEC,
    );
  }

  async login(username: string, password: string) {
    if (!username || !password) {
      throw new UnauthorizedException('Identifiant et mot de passe requis');
    }
    const key = username.toLowerCase();
    const rec = this.attempts.get(key);
    if (rec && rec.lockedUntil > Date.now()) {
      throw new UnauthorizedException(
        'Trop de tentatives. Réessayez dans quelques minutes.',
      );
    }

    const user = await this.usersService.findByUsername(username);
    // Message volontairement générique pour ne pas révéler l'existence du compte.
    if (
      !user ||
      !user.actif ||
      (user as any).deleted ||
      !verifyPassword(password, user.passwordHash)
    ) {
      const fails = (rec?.fails ?? 0) + 1;
      const lockedUntil = fails >= MAX_LOGIN_FAILS ? Date.now() + LOGIN_LOCK_MS : 0;
      this.attempts.set(key, { fails, lockedUntil });
      throw new UnauthorizedException('Identifiants invalides');
    }

    this.attempts.delete(key);
    await this.usersService.updateLastLogin(user.id);
    return { access_token: this.signFor(user), user: user.toJSON() };
  }

  async me(userId: string) {
    const user = await this.usersService.findById(userId);
    if (!user) throw new UnauthorizedException('Utilisateur introuvable');
    return user.toJSON();
  }

  /** Mise à jour par l'utilisateur de ses propres informations (nom + email). */
  async updateProfile(userId: string, data: { nom?: string; email?: string }) {
    const user = await this.usersService.update(userId, {
      nom: data?.nom,
      email: data?.email,
    });
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
    // setPassword incrémente tokenVersion (révoque les AUTRES sessions) ;
    // on resigne un jeton pour garder la session courante valide.
    const updated = await this.usersService.setPassword(userId, next);
    return { ok: true, access_token: this.signFor(updated) };
  }

  /** Déconnecte toutes les sessions (y compris la courante) en invalidant les jetons. */
  async logoutAll(userId: string) {
    await this.usersService.bumpTokenVersion(userId);
    return { ok: true };
  }

  /** Demande de réinitialisation : envoie un lien par email. Réponse neutre. */
  async forgotPassword(email: string) {
    const e = (email || '').trim();
    if (e) {
      const user = await this.usersService.findByEmail(e);
      if (user && user.actif && !(user as any).deleted) {
        const token = randomBytes(32).toString('hex');
        await this.usersService.setResetToken(
          user.id,
          sha256(token),
          Date.now() + RESET_TOKEN_TTL_MS,
        );
        const link = `${APP_URL}/reinitialiser-mot-de-passe?token=${token}`;
        await this.mailService.sendPasswordResetLink((user as any).email, user.username, link);
      }
    }
    // Toujours neutre : ne pas révéler si l'email existe.
    return { ok: true };
  }

  /** Consomme un jeton de réinitialisation et définit le nouveau mot de passe. */
  async resetPassword(token: string, password: string) {
    if (!token) throw new BadRequestException('Jeton manquant.');
    const user = await this.usersService.findByValidResetToken(sha256(token));
    if (!user) {
      throw new BadRequestException('Lien invalide ou expiré.');
    }
    await this.usersService.setPassword(user.id, password); // valide + révoque les sessions
    await this.usersService.clearResetToken(user.id);
    return { ok: true };
  }
}
