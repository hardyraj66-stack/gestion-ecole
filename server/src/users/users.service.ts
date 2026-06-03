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
import { hashPassword } from '../auth/password.util';
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

  findById(id: string) {
    return this.userModel.findById(id);
  }

  findAll() {
    return this.userModel.find().sort({ createdAt: 1 });
  }

  async create(data: {
    username?: string;
    password?: string;
    nom?: string;
    role?: Role;
  }) {
    if (!data.username || !data.password) {
      throw new BadRequestException('Identifiant et mot de passe requis');
    }
    if (data.password.length < 4) {
      throw new BadRequestException('Mot de passe trop court (4 caractères min.)');
    }
    if (data.role && !ROLES.includes(data.role)) {
      throw new BadRequestException('Rôle invalide');
    }
    const existing = await this.findByUsername(data.username);
    if (existing) throw new ConflictException('Cet identifiant existe déjà');

    return this.userModel.create({
      username: data.username.toLowerCase(),
      passwordHash: hashPassword(data.password),
      nom: data.nom || '',
      role: data.role || 'secretaire',
      actif: true,
    });
  }

  async update(
    id: string,
    data: { nom?: string; role?: Role; actif?: boolean },
  ) {
    const update: Partial<User> = {};
    if (data.nom !== undefined) update.nom = data.nom;
    if (data.role !== undefined) {
      if (!ROLES.includes(data.role)) throw new BadRequestException('Rôle invalide');
      update.role = data.role;
    }
    if (data.actif !== undefined) update.actif = data.actif;

    // Empêche de retirer le dernier admin (rôle changé ou compte désactivé).
    if (update.role === 'professeur' || update.role === 'secretaire' || update.actif === false) {
      const target = await this.userModel.findById(id);
      if (target?.role === 'admin') await this.assertNotLastAdmin();
    }

    const user = await this.userModel.findByIdAndUpdate(id, update, { new: true });
    if (!user) throw new NotFoundException('Utilisateur introuvable');
    return user;
  }

  async setPassword(id: string, password: string) {
    if (!password || password.length < 4) {
      throw new BadRequestException('Mot de passe trop court (4 caractères min.)');
    }
    const user = await this.userModel.findByIdAndUpdate(
      id,
      { passwordHash: hashPassword(password) },
      { new: true },
    );
    if (!user) throw new NotFoundException('Utilisateur introuvable');
    return user;
  }

  async remove(id: string) {
    const target = await this.userModel.findById(id);
    if (!target) throw new NotFoundException('Utilisateur introuvable');
    if (target.role === 'admin') await this.assertNotLastAdmin();
    await this.userModel.findByIdAndDelete(id);
    return { ok: true };
  }

  private async assertNotLastAdmin() {
    const activeAdmins = await this.userModel.countDocuments({
      role: 'admin',
      actif: true,
    });
    if (activeAdmins <= 1) {
      throw new BadRequestException(
        'Impossible : il doit rester au moins un administrateur actif',
      );
    }
  }
}
