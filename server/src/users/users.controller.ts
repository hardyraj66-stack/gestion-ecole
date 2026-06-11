import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { MailService } from '../mail/mail.service';
import { AuditService } from '../audit/audit.service';
import { generatePassword } from '../auth/password.util';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser } from '../auth/current-user.decorator';

/** Gestion des comptes — réservée aux administrateurs. */
@Controller('users')
@Roles('admin')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly mailService: MailService,
    private readonly audit: AuditService,
  ) {}

  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Get('archives')
  findArchived() {
    return this.usersService.findDeleted();
  }

  @Post()
  async create(@CurrentUser('id') byId: string, @Body() body: any): Promise<any> {
    const email = (body.email || '').trim();
    // L'email doit être unique parmi tous les comptes (admin/secrétaire/professeur).
    await this.usersService.assertEmailAvailable(email);
    // Mot de passe saisi par l'admin, sinon généré automatiquement.
    const typed = typeof body.password === 'string' && body.password.length > 0 ? body.password : null;
    const password = typed || generatePassword();
    // Forcer le changement si le mot de passe est généré ou envoyé par email.
    const mustChangePassword = !!email || !typed;

    const user = await this.usersService.create({
      username: body.username,
      nom: body.nom,
      email,
      role: body.role,
      password,
      mustChangePassword,
    });

    const account: { username: string; emailSent: boolean; password?: string } = {
      username: user.username,
      emailSent: false,
    };
    if (email) {
      const mail = await this.mailService.sendCredentials(email, user.username, password, {
        kind: 'creation',
        role: user.role,
      });
      account.emailSent = mail.sent;
    }
    // On affiche le mot de passe à l'admin uniquement si l'email n'est pas parti.
    if (!account.emailSent) account.password = password;

    await this.audit.log('user.create', user.id, byId, { role: user.role, email });
    return { ...user.toJSON(), account };
  }

  @Patch(':id')
  async update(@CurrentUser('id') byId: string, @Param('id') id: string, @Body() body: any) {
    const user = await this.usersService.update(id, body);
    await this.audit.log('user.update', id, byId, {
      nom: body?.nom, email: body?.email, role: body?.role, actif: body?.actif,
    });
    return user;
  }

  @Patch(':id/password')
  async setPassword(@CurrentUser('id') byId: string, @Param('id') id: string, @Body() body: { password?: string }): Promise<any> {
    const user = await this.usersService.findById(id);
    if (!user) throw new NotFoundException('Utilisateur introuvable');

    // Mot de passe saisi par l'admin, sinon généré automatiquement.
    const typed = typeof body?.password === 'string' && body.password.length > 0 ? body.password : null;
    const password = typed || generatePassword();
    const email = (user as any).email || '';

    await this.usersService.setPassword(id, password);
    // Après une réinitialisation, on force le changement à la prochaine connexion.
    await this.usersService.setMustChangePassword(id, true);

    const account: { username: string; emailSent: boolean; password?: string } = {
      username: user.username,
      emailSent: false,
    };
    if (email) {
      const mail = await this.mailService.sendCredentials(email, user.username, password, {
        kind: 'reset',
        role: user.role,
      });
      account.emailSent = mail.sent;
    }
    if (!account.emailSent) account.password = password;

    await this.audit.log('user.reset_password', id, byId, {});
    return { account };
  }

  @Patch(':id/restaurer')
  async restore(@CurrentUser('id') byId: string, @Param('id') id: string) {
    const user = await this.usersService.restore(id);
    await this.audit.log('user.restore', id, byId, {});
    return user;
  }

  @Delete(':id')
  async remove(@CurrentUser('id') byId: string, @Param('id') id: string) {
    const res = await this.usersService.remove(id);
    await this.audit.log('user.delete', id, byId, {});
    return res;
  }
}
