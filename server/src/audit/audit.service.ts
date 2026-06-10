import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AuditLog } from './audit.schema';

@Injectable()
export class AuditService {
  private readonly logger = new Logger('AuditService');

  constructor(@InjectModel(AuditLog.name) private model: Model<AuditLog>) {}

  /** Enregistre une action sur un compte. Ne lève jamais (journalisation best-effort). */
  async log(action: string, targetUserId: string, byUserId: string, meta: Record<string, any> = {}) {
    try {
      await this.model.create({ action, targetUserId, byUserId, meta });
    } catch (e: any) {
      this.logger.warn(`Échec journalisation ${action} : ${e?.message ?? e}`);
    }
  }

  /** Derniers événements (admin). */
  recent(limit = 100) {
    return this.model.find().sort({ createdAt: -1 }).limit(limit).exec();
  }
}
