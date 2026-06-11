import { Injectable, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Professeur } from './professeur.schema';
import { TeacherAssignment } from '../teacher-assignments/teacher-assignment.schema';
import { UsersService } from '../users/users.service';
import { MailService } from '../mail/mail.service';
import { generatePassword } from '../auth/password.util';
import { assertValidEmail } from '../auth/validation.util';

export interface AccountResult {
  username: string;
  emailSent: boolean;
  /** Renvoyé uniquement si l'email n'a pas pu être envoyé (fallback admin). */
  password?: string;
}

@Injectable()
export class ProfesseursService {
  constructor(
    @InjectModel(Professeur.name) private model: Model<Professeur>,
    @InjectModel(TeacherAssignment.name) private assignmentModel: Model<TeacherAssignment>,
    private readonly usersService: UsersService,
    private readonly mailService: MailService,
  ) {}

  findAll() { return this.model.find().exec(); }
  findById(id: string) { return this.model.findById(id).exec(); }
  findActifs() { return this.model.find({ statut: 'actif' }).exec(); }

  /**
   * Crée la fiche professeur ET son compte de connexion lié.
   * Le mot de passe est généré côté serveur ; les identifiants sont envoyés
   * par email (non bloquant). En cas d'échec/absence de SMTP, le mot de passe
   * est renvoyé dans `account.password` pour transmission manuelle par l'admin.
   */
  async create(data: any): Promise<{ professeur: Professeur; account: AccountResult }> {
    const email = (data.email || '').trim();
    if (!email) {
      throw new BadRequestException("L'email est requis pour créer le compte du professeur.");
    }
    assertValidEmail(email);

    // Une fiche professeur existe déjà avec cet email ?
    const existingProf = await this.model
      .findOne({ email })
      .collation({ locale: 'en', strength: 2 })
      .exec();
    if (existingProf) {
      const profId = (existingProf as any).id;
      const linked = await this.usersService.findByProfesseurId(profId) as any;
      const hasActiveAccount = linked && !linked.deleted && linked.actif;
      // Prof actif AVEC un compte actif → vrai doublon, on refuse (avec lien vers la fiche).
      if ((existingProf as any).statut === 'actif' && hasActiveAccount) {
        throw new ConflictException({
          statusCode: 409,
          error: 'Conflict',
          message: 'Un professeur actif avec cet email possède déjà un compte.',
          professeurId: profId,
        });
      }
      // Sinon on réutilise la fiche (ses affectations sont préservées) :
      // réactivation si inactive + mise à jour des infos saisies, puis on rétablit le compte.
      (existingProf as any).nom = data.nom ?? (existingProf as any).nom;
      (existingProf as any).prenom = data.prenom ?? (existingProf as any).prenom;
      (existingProf as any).genre = data.genre ?? (existingProf as any).genre;
      if (data.telephone !== undefined) (existingProf as any).telephone = data.telephone;
      (existingProf as any).statut = 'actif';
      await existingProf.save();
      const account = await this.createAccountForProfesseur(profId);
      return { professeur: existingProf, account: account as AccountResult };
    }

    // Pas de fiche : refuser si un compte ACTIF (non archivé) utilise déjà cet email.
    const existingUser =
      (await this.usersService.findByUsername(email.toLowerCase())) ||
      (await this.usersService.findByEmail(email));
    if (existingUser && !(existingUser as any).deleted) {
      throw new ConflictException('Un compte utilisant cet email existe déjà.');
    }

    const prof = await new this.model(data).save();

    const password = generatePassword();
    const username = await this.resolveUniqueUsername(data.email, data.prenom, data.nom);
    await this.usersService.create({
      username,
      password,
      nom: `${data.prenom ?? ''} ${data.nom ?? ''}`.trim(),
      email: data.email,
      role: 'professeur',
      professeur_id: (prof as any).id ?? (prof as any)._id?.toString(),
      mustChangePassword: true,
    });

    const mail = await this.mailService.sendCredentials(data.email, username, password, {
      kind: 'creation',
      role: 'professeur',
    });
    const account: AccountResult = { username, emailSent: mail.sent };
    if (!mail.sent) account.password = password;

    return { professeur: prof, account };
  }

  /**
   * Crée le compte de connexion d'une fiche professeur existante (ou restaure
   * un compte archivé). Renvoie les identifiants par email (fallback admin).
   */
  async createAccountForProfesseur(professeurId: string): Promise<AccountResult | null> {
    const prof = await this.model.findById(professeurId).lean().exec() as any;
    if (!prof) return null;
    const password = generatePassword();
    const existing = await this.usersService.findByProfesseurId(professeurId) as any;

    if (existing) {
      if (!existing.deleted && existing.actif) {
        throw new ConflictException('Ce professeur a déjà un compte actif.');
      }
      // Compte archivé → restaurer ; compte désactivé → réactiver. Puis régénérer + email.
      const uid = existing.id ?? existing._id.toString();
      if (existing.deleted) await this.usersService.restore(uid);
      await this.usersService.setActifByProfesseur(professeurId, true);
      await this.usersService.setPassword(uid, password);
      await this.usersService.setMustChangePassword(uid, true);
      const mail = await this.mailService.sendCredentials(prof.email, existing.username, password, {
        kind: 'reset',
        role: 'professeur',
      });
      const account: AccountResult = { username: existing.username, emailSent: mail.sent };
      if (!mail.sent) account.password = password;
      return account;
    }

    // Aucun compte → en créer un neuf.
    const username = await this.resolveUniqueUsername(prof.email, prof.prenom, prof.nom);
    await this.usersService.create({
      username,
      password,
      nom: `${prof.prenom ?? ''} ${prof.nom ?? ''}`.trim(),
      email: prof.email,
      role: 'professeur',
      professeur_id: professeurId,
      mustChangePassword: true,
    });
    const mail = await this.mailService.sendCredentials(prof.email, username, password, {
      kind: 'creation',
      role: 'professeur',
    });
    const account: AccountResult = { username, emailSent: mail.sent };
    if (!mail.sent) account.password = password;
    return account;
  }

  /** Régénère le mot de passe et renvoie les identifiants par email (ou en fallback). */
  async resendCredentials(professeurId: string): Promise<AccountResult | null> {
    const prof = await this.model.findById(professeurId).lean().exec();
    if (!prof) return null;
    const user = await this.usersService.findByProfesseurId(professeurId);
    if (!user) return null;
    const userId = (user as any).id ?? (user as any)._id.toString();
    const password = generatePassword();
    await this.usersService.setPassword(userId, password);
    await this.usersService.setMustChangePassword(userId, true);
    const mail = await this.mailService.sendCredentials((prof as any).email, (user as any).username, password, {
      kind: 'reset',
      role: 'professeur',
    });
    const account: AccountResult = { username: (user as any).username, emailSent: mail.sent };
    if (!mail.sent) account.password = password;
    return account;
  }

  update(id: string, data: any) {
    return this.model.findByIdAndUpdate(id, data, { new: true }).exec();
  }

  async desactiver(id: string) {
    const prof = await this.model.findByIdAndUpdate(
      id,
      { statut: 'inactif' },
      { new: true },
    ).exec();
    if (!prof) return false;
    await this.assignmentModel.deleteMany({ professeur_id: id }).exec();
    await this.usersService.setActifByProfesseur(id, false);
    return true;
  }

  async activer(id: string) {
    const prof = await this.model.findByIdAndUpdate(id, { statut: 'actif' }, { new: true }).exec();
    if (!prof) return false;
    await this.usersService.setActifByProfesseur(id, true);
    return true;
  }

  /** username = email ; fallback slug(prenom.nom) + suffixe numérique si collision. */
  private async resolveUniqueUsername(email?: string, prenom?: string, nom?: string): Promise<string> {
    const candidates: string[] = [];
    if (email) candidates.push(email.toLowerCase().trim());
    const slug = this.slug(`${prenom ?? ''}.${nom ?? ''}`);
    if (slug) candidates.push(slug);
    for (const base of candidates) {
      if (!(await this.usersService.findByUsername(base))) return base;
    }
    // Tous pris → suffixer le slug (ou l'email) jusqu'à trouver libre.
    const base = candidates[candidates.length - 1] || `prof`;
    for (let i = 2; i < 1000; i++) {
      const next = `${base}${i}`;
      if (!(await this.usersService.findByUsername(next))) return next;
    }
    return `${base}.${Date.now()}`;
  }

  private slug(input: string): string {
    return input
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9.]+/g, '.')
      .replace(/^\.+|\.+$/g, '')
      .replace(/\.{2,}/g, '.');
  }
}
