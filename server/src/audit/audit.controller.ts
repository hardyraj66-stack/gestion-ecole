import { Controller, Get } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AuditService } from './audit.service';
import { User } from '../users/user.schema';
import { Roles } from '../auth/roles.decorator';

/** Journal des actions sur les comptes — réservé aux administrateurs. */
@Controller('audit')
@Roles('admin')
export class AuditController {
  constructor(
    private readonly audit: AuditService,
    @InjectModel(User.name) private readonly userModel: Model<User>,
  ) {}

  @Get()
  async recent() {
    const logs = await this.audit.recent(200);
    const ids = [
      ...new Set(
        logs
          .flatMap((l: any) => [l.byUserId, l.targetUserId])
          .filter((id: string) => /^[a-f0-9]{24}$/i.test(id || '')),
      ),
    ];
    const nameById = new Map<string, string>();
    const users = await this.userModel.find({ _id: { $in: ids } }).lean().exec();
    (users as any[]).forEach((u) => nameById.set(u._id.toString(), u.username));

    return (logs as any[]).map((l) => ({
      id: l.id,
      action: l.action,
      meta: l.meta || {},
      createdAt: l.createdAt,
      by: nameById.get(l.byUserId) || l.byUserId || '—',
      target: nameById.get(l.targetUserId) || l.targetUserId || '—',
    }));
  }
}
