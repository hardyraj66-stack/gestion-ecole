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
const FORGOT_MAX_PER_WINDOW = 3; // 3 demandes max
const FORGOT_WINDOW_MS = 60 * 60 * 1000; // par heure et par email

function sha256(input: string): string {
  return createHash('sha256').update(input).digest('hex');
}

@Injectable()
export class AuthService {
  // Anti brute-force : compteur d'échecs en mémoire par identifiant.
  private readonly attempts = new Map<string, { fails: number; lockedUntil: number }>();
  // Anti-spam « mot de passe oublié » : fenêtre glissante par email.
  private readonly forgotHits = new Map<string, { count: number; windowStart: number }>();

  constructor(
    private usersService: UsersService,
    private mailService: MailService,
  ) {}

  /** Signe un jeton pour un utilisateur (version de jeton + identifiant de session). */
  private signFor(user: any, jti: string): string {
    return signJwt(
      {
        sub: user.id,
        username: user.username,
        role: user.role,
        professeur_id: user.professeur_id ?? null,
        tv: user.tokenVersion ?? 0,
        jti,
      },
      JWT_SECRET,
      JWT_EXPIRES_IN_SEC,
    );
  }

  async login(
    username: string,
    password: string,
    ctx: { userAgent?: string; ip?: string } = {},
  ) {
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
    // Crée une session pour cet appareil.
    const jti = randomBytes(16).toString('hex');
    await this.usersService.addSession(user.id, {
      jti,
      userAgent: (ctx.userAgent || '').slice(0, 300),
      ip: ctx.ip || '',
      createdAt: new Date(),
    });
    return { access_token: this.signFor(user, jti), user: user.toJSON() };
  }

  /** Sessions actives de l'utilisateur (marque la session courante). */
  async listSessions(userId: string, currentJti?: string) {
    const user = await this.usersService.findById(userId);
    if (!user) throw new UnauthorizedException('Utilisateur introuvable');
    return ((user as any).sessions || [])
      .slice()
      .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .map((s: any) => ({
        jti: s.jti,
        userAgent: s.userAgent,
        ip: s.ip,
        createdAt: s.createdAt,
        current: !!currentJti && s.jti === currentJti,
      }));
  }

  /** Révoque une session précise (un appareil). */
  async revokeSession(userId: string, jti: string) {
    await this.usersService.removeSession(userId, jti);
    return { ok: true };
  }

  /** Déconnexion simple : retire la session courante. */
  async logout(userId: string, jti?: string) {
    if (jti) await this.usersService.removeSession(userId, jti);
    return { ok: true };
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

  async changePassword(userId: string, current: string, next: string, jti?: string) {
    if (!current || !next) {
      throw new BadRequestException('Mot de passe actuel et nouveau requis');
    }
    const user = await this.usersService.findById(userId);
    if (!user) throw new UnauthorizedException('Utilisateur introuvable');
    if (!verifyPassword(current, user.passwordHash)) {
      throw new BadRequestException('Mot de passe actuel incorrect');
    }
    // setPassword incrémente tokenVersion (révoque les AUTRES sessions).
    const updated = await this.usersService.setPassword(userId, next);
    // On garde uniquement la session courante et on resigne un jeton valide.
    if (jti) await this.usersService.keepOnlySession(userId, jti);
    return { ok: true, access_token: this.signFor(updated, jti || randomBytes(16).toString('hex')) };
  }

  /** Déconnecte toutes les sessions (y compris la courante) en invalidant les jetons. */
  async logoutAll(userId: string) {
    await this.usersService.clearSessions(userId);
    await this.usersService.bumpTokenVersion(userId);
    return { ok: true };
  }

  /** Limite le nombre de demandes de réinitialisation par email (fenêtre glissante). */
  private forgotAllowed(email: string): boolean {
    const key = email.toLowerCase();
    const now = Date.now();
    const rec = this.forgotHits.get(key);
    if (!rec || now - rec.windowStart > FORGOT_WINDOW_MS) {
      this.forgotHits.set(key, { count: 1, windowStart: now });
      return true;
    }
    if (rec.count >= FORGOT_MAX_PER_WINDOW) return false;
    rec.count += 1;
    return true;
  }

  /** Demande de réinitialisation : envoie un lien par email. Réponse neutre. */
  async forgotPassword(email: string) {
    const e = (email || '').trim();
    // Anti-spam : on plafonne les envois par email, mais la réponse reste neutre.
    if (e && this.forgotAllowed(e)) {
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
