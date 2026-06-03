/**
 * Réinitialise la base de données avec un jeu de données COMPLET (année 2024-2025
 * active : classes, élèves, matières, salles, niveaux, notes 3 trimestres,
 * professeurs + affectations, périodes toutes terminées).
 *
 * Usage :
 *   cd server && npm run reset
 *
 * Fonctionne sans serveur HTTP démarré (contexte Nest autonome). Si un serveur de
 * développement tourne déjà, ses données seront aussi à jour (même MongoDB).
 */
import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { AppModule } from '../app.module';
import { SeederService } from './seeder.service';
import { ViewBuilderService } from '../read/view-builder.service';

async function run() {
  const logger = new Logger('Reset');
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  try {
    const seeder = app.get(SeederService);
    const viewBuilder = app.get(ViewBuilderService);

    logger.log('Réinitialisation complète de la base…');
    await seeder.reset();
    await viewBuilder.rebuildAll();
    logger.log('✓ Base réinitialisée — 2024-2025 active avec données complètes');
  } finally {
    await app.close();
  }
  process.exit(0);
}

run().catch((e) => {
  console.error('Échec de la réinitialisation :', e);
  process.exit(1);
});
