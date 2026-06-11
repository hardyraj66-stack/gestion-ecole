import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

export interface SendResult {
  sent: boolean;
  reason?: string;
}

export interface CredentialsContext {
  /** Création d'un nouveau compte, ou réinitialisation d'un compte existant. */
  kind: 'creation' | 'reset';
  /** Rôle du compte (admin | secretaire | professeur) — adapte le libellé. */
  role?: string;
}

const ROLE_LABELS: Record<string, string> = {
  admin: 'administrateur',
  secretaire: 'secrétaire',
  professeur: 'enseignant',
};

/**
 * Envoi d'emails via SMTP (nodemailer). Configuration lue dans process.env.
 * Si SMTP_HOST n'est pas configuré, l'envoi est désactivé sans erreur :
 * l'appelant retombe alors sur l'affichage du mot de passe à l'administrateur.
 */
@Injectable()
export class MailService {
  private readonly logger = new Logger('MailService');
  private transporter: nodemailer.Transporter | null = null;

  private getTransporter(): nodemailer.Transporter | null {
    if (!process.env.SMTP_HOST) return null;
    if (!this.transporter) {
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587', 10),
        secure: process.env.SMTP_SECURE === 'true',
        auth: process.env.SMTP_USER
          ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
          : undefined,
      });
    }
    return this.transporter;
  }

  get isConfigured(): boolean {
    return !!process.env.SMTP_HOST;
  }

  /**
   * Envoie les identifiants de connexion (création de compte ou réinitialisation).
   * Le contenu s'adapte au contexte. Ne lève jamais d'exception.
   */
  async sendCredentials(
    email: string,
    username: string,
    password: string,
    ctx: CredentialsContext = { kind: 'creation' },
  ): Promise<SendResult> {
    const transporter = this.getTransporter();
    if (!transporter) {
      this.logger.warn('SMTP non configuré (SMTP_HOST absent) → envoi désactivé.');
      return { sent: false, reason: 'smtp_not_configured' };
    }

    const roleLabel = (ctx.role && ROLE_LABELS[ctx.role]) || 'utilisateur';
    const isReset = ctx.kind === 'reset';

    const subject = isReset
      ? 'Réinitialisation de votre mot de passe Ekolova'
      : 'Vos identifiants Ekolova';
    const intro = isReset
      ? `Le mot de passe de votre compte Ekolova a été réinitialisé par l'administration.`
      : `Un compte ${roleLabel} vient d'être créé pour vous sur Ekolova.`;
    const passwordLabel = isReset ? 'Nouveau mot de passe provisoire' : 'Mot de passe provisoire';
    const whenChange = isReset ? 'votre prochaine connexion' : 'votre première connexion';

    try {
      await transporter.sendMail({
        from: process.env.SMTP_FROM || 'Ekolova <no-reply@ekolova.local>',
        to: email,
        subject,
        text:
          `Bonjour,\n\n` +
          `${intro}\n\n` +
          `Identifiant : ${username}\n` +
          `${passwordLabel} : ${password}\n\n` +
          `Pour des raisons de sécurité, il vous sera demandé de changer ce mot de passe à ${whenChange}.\n\n` +
          `Cordialement,\nL'administration`,
      });
      this.logger.log(`Identifiants envoyés à ${email} (${ctx.kind}, ${ctx.role ?? 'n/a'})`);
      return { sent: true };
    } catch (e: any) {
      this.logger.error(`Échec d'envoi à ${email} : ${e?.message ?? e}`);
      return { sent: false, reason: 'send_failed' };
    }
  }

  /** Envoie un lien de réinitialisation de mot de passe. Ne lève jamais d'exception. */
  async sendPasswordResetLink(email: string, username: string, link: string): Promise<SendResult> {
    const transporter = this.getTransporter();
    if (!transporter) {
      this.logger.warn('SMTP non configuré → lien de réinitialisation non envoyé.');
      return { sent: false, reason: 'smtp_not_configured' };
    }
    try {
      await transporter.sendMail({
        from: process.env.SMTP_FROM || 'Ekolova <no-reply@ekolova.local>',
        to: email,
        subject: 'Réinitialisation de votre mot de passe Ekolova',
        text:
          `Bonjour,\n\n` +
          `Une réinitialisation du mot de passe a été demandée pour le compte « ${username} ».\n\n` +
          `Cliquez sur ce lien pour définir un nouveau mot de passe (valable 1 heure) :\n${link}\n\n` +
          `Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.\n\n` +
          `Cordialement,\nL'administration`,
      });
      this.logger.log(`Lien de réinitialisation envoyé à ${email}`);
      return { sent: true };
    } catch (e: any) {
      this.logger.error(`Échec d'envoi du lien à ${email} : ${e?.message ?? e}`);
      return { sent: false, reason: 'send_failed' };
    }
  }
}
