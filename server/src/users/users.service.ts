import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from './user.schema';
import { hashPassword, validatePasswordStrength } from '../auth/password.util';
import { assertValidEmail } from '../auth/validation.util';
import { Role, ROLES } from '../auth/auth.constants';

@Injectable()
export class UsersService implements OnModuleInit {
  private readonly logger = new Logger('UsersService');

  constructor(@InjectModel(User.name) private userModel: Model<User>) {}

  /** Crée un compte admin par défaut au premier démarrage si aucun utilisateur n'existe. */
  async onModuleInit() {
    const count = await this.userModel.countDocuments();
    if (count > 0) return;

    const username = (process.env.ADMIN_USERNAME || 'admin').toLowerCase();
    const password = process.env.ADMIN_PASSWORD || 'admin123';
    await this.userModel.create({
      username,
      passwordHash: hashPassword(password),
      nom: 'Administrateur',
      role: 'admin',
      actif: true,
    });
    this.logger.warn(
      `⚠️  Compte admin par défaut créé → identifiant: "${username}" / mot de passe: "${password}" — À CHANGER après la première connexion.`,
    );
  }

  findByUsername(username: string) {
    return this.userModel.findOne({ username: username.toLowerCase() });
  }

  /** Recherche un compte par email (insensible à la casse). */
  findByEmail(email: string) {
    if (!email) return null;
    return this.userModel
      .findOne({ email: email.trim() })
      .collation({ locale: 'en', strength: 2 })
      .exec();
  }

  /** Vérifie qu'aucun autre compte n'utilise déjà cet email (unicité globale). */
  async assertEmailAvailable(email: string, excludeId?: string) {
    const e = (email || '').trim();
    if (!e) return;
    const existing = await this.findByEmail(e);
    if (existing && existing.id !== excludeId) {
      throw new ConflictException('Un compte utilisant cet email existe déjà.');
    }
  }

  findById(id: string) {
    return this.userModel.findById(id);
  }

  findAll(opts: { includeDeleted?: boolean } = {}) {
    const filter = opts.includeDeleted ? {} : { deleted: { $ne: true } };
    return this.userModel.find(filter).sort({ createdAt: 1 });
  }

  /** Comptes archivés (soft-deleted). */
  findDeleted() {
    return this.userModel.find({ deleted: true }).sort({ updatedAt: -1 });
  }

  findByProfesseurId(professeurId: string) {
    return this.userModel.findOne({ professeur_id: professeurId });
  }

  async create(data: {
    username?: string;
    password?: string;
    nom?: string;
    email?: string;
    role?: Role;
    professeur_id?: string | null;
    mustChangePassword?: boolean;
  }) {
    if (!data.username || !data.password) {
      throw new BadRequestException('Identifiant et mot de passe requis');
    }
    validatePasswordStrength(data.password);
    if (data.role && !ROLES.includes(data.role)) {
      throw new BadRequestException('Rôle invalide');
    }
    if (data.email) assertValidEmail(data.email);
    const existing = await this.findByUsername(data.username);
    if (existing) throw new ConflictException('Cet identifiant existe déjà');

    return this.userModel.create({
      username: data.username.toLowerCase(),
      passwordHash: hashPassword(data.password),
      nom: data.nom || '',
      email: data.email || '',
      role: data.role || 'secretaire',
      actif: true,
      professeur_id: data.professeur_id ?? null,
      mustChangePassword: data.mustChangePassword ?? false,
    });
  }

  /** Synchronise le statut actif/inactif du compte lié à une fiche professeur. */
  async setActifByProfesseur(professeurId: string, actif: boolean) {
    await this.userModel.updateOne(
      { professeur_id: professeurId },
      { $set: { actif } },
    );
  }

  /** Active/désactive l'obligation de changer le mot de passe à la prochaine connexion. */
  async setMustChangePassword(id: string, value: boolean) {
    await this.userModel.findByIdAndUpdate(id, { mustChangePassword: value });
  }

  async update(
    id: string,
    data: { nom?: string; email?: string; role?: Role; actif?: boolean },
  ) {
    const target = await this.userModel.findById(id);
    if (!target) throw new NotFoundException('Utilisateur introuvable');

    const update: Partial<User> = {};
    if (data.nom !== undefined) update.nom = data.nom;
    if (data.email !== undefined) {
      const e = (data.email || '').trim();
      if (e) {
        assertValidEmail(e);
        await this.assertEmailAvailable(e, id);
      }
      update.email = e;
    }
    if (data.role !== undefined) {
      if (!ROLES.includes(data.role)) throw new BadRequestException('Rôle invalide');
      update.role = data.role;
      // Changement de rôle hors 'professeur' → détacher la fiche professeur liée.
      if (data.role !== 'professeur' && target.role === 'professeur') {
        update.professeur_id = null;
      }
    }
    if (data.actif !== undefined) update.actif = data.actif;

    // Empêche de retirer le dernier admin (rôle changé ou compte désactivé).
    if (update.role === 'professeur' || update.role === 'secretaire' || update.actif === false) {
      if (target.role === 'admin') await this.assertNotLastAdmin();
    }

    const user = await this.userModel.findByIdAndUpdate(id, update, { new: true });
    if (!user) throw new NotFoundException('Utilisateur introuvable');
    return user;
  }

  async setPassword(id: string, password: string) {
    validatePasswordStrength(password);
    const user = await this.userModel.findByIdAndUpdate(
      id,
      // Réinitialiser le mdp invalide les sessions existantes (tokenVersion++).
      { passwordHash: hashPassword(password), mustChangePassword: false, $inc: { tokenVersion: 1 } },
      { new: true },
    );
    if (!user) throw new NotFoundException('Utilisateur introuvable');
    return user;
  }

  /** Incrémente la version de jeton → invalide toutes les sessions du compte. */
  async bumpTokenVersion(id: string) {
    await this.userModel.findByIdAndUpdate(id, { $inc: { tokenVersion: 1 } });
  }

  /** Enregistre la date de dernière connexion. */
  async updateLastLogin(id: string) {
    await this.userModel.findByIdAndUpdate(id, { lastLoginAt: new Date() });
  }

  /** Soft-delete : archive le compte (récupérable), invalide ses sessions. */
  async remove(id: string) {
    const target = await this.userModel.findById(id);
    if (!target) throw new NotFoundException('Utilisateur introuvable');
    if (target.role === 'admin') await this.assertNotLastAdmin();
    await this.userModel.findByIdAndUpdate(id, {
      deleted: true,
      actif: false,
      $inc: { tokenVersion: 1 },
    });
    return { ok: true };
  }

  /** Enregistre un jeton de réinitialisation (hash + expiration). */
  async setResetToken(id: string, hash: string, expires: number) {
    await this.userModel.findByIdAndUpdate(id, {
      resetTokenHash: hash,
      resetTokenExpires: expires,
    });
  }

  /** Trouve un compte par jeton de réinitialisation valide (non expiré, non archivé). */
  findByValidResetToken(hash: string) {
    return this.userModel.findOne({
      resetTokenHash: hash,
      resetTokenExpires: { $gt: Date.now() },
      deleted: { $ne: true },
    });
  }

  /** Efface le jeton de réinitialisation après usage. */
  async clearResetToken(id: string) {
    await this.userModel.findByIdAndUpdate(id, {
      resetTokenHash: '',
      resetTokenExpires: 0,
    });
  }

  /** Restaure un compte archivé. */
  async restore(id: string) {
    const user = await this.userModel.findByIdAndUpdate(
      id,
      { deleted: false, actif: true },
      { new: true },
    );
    if (!user) throw new NotFoundException('Utilisateur introuvable');
    return user;
  }

  private async assertNotLastAdmin() {
    const activeAdmins = await this.userModel.countDocuments({
      role: 'admin',
      actif: true,
      deleted: { $ne: true },
    });
    if (activeAdmins <= 1) {
      throw new BadRequestException(
        'Impossible : il doit rester au moins un administrateur actif',
      );
    }
  }
}
