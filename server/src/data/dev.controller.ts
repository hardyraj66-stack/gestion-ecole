import { Controller, Post, ForbiddenException } from '@nestjs/common';
import { SeederService } from './seeder.service';
import { ViewBuilderService } from '../read/view-builder.service';

/**
 * Endpoints de développement / E2E.
 * Désactivés en production.
 */
@Controller('dev')
export class DevController {
  constructor(
    private readonly seeder: SeederService,
    private readonly viewBuilder: ViewBuilderService,
  ) {}

  /** Réinitialise la base avec un jeu de données complet (année 2024-2025 fin d'année). */
  @Post('reset')
  async reset() {
    if (process.env.NODE_ENV === 'production') {
      throw new ForbiddenException('Reset interdit en production');
    }
    await this.seeder.reset();
    await this.viewBuilder.rebuildAll();
    return { ok: true, message: 'Base réinitialisée avec un jeu de données complet' };
  }
}
