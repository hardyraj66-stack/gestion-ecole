import 'reflect-metadata';
import 'dotenv/config'; // charge server/.env (SMTP, JWT_SECRET, ADMIN_*) avant tout process.env
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  // Sécurité prod : refuser de démarrer avec le secret JWT par défaut.
  if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
    throw new Error(
      'JWT_SECRET doit être défini en production (refus de démarrer avec le secret par défaut).',
    );
  }

  const app = await NestFactory.create(AppModule);

  // En production, le frontend (servi par ce même serveur via ServeStaticModule)
  // appelle l'API sous le préfixe /api → même origine, pas de CORS, et pas de
  // conflit entre les routes API et les routes SPA. En dev, pas de préfixe.
  if (process.env.NODE_ENV === 'production') {
    app.setGlobalPrefix('api');
  }

  // CORS : restreint via CORS_ORIGIN (liste séparée par des virgules), sinon ouvert (dev).
  const corsOrigin = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim())
    : '*';
  app.enableCors({
    origin: corsOrigin,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`🚀 GestionÉcole API running on http://localhost:${port}`);
}
bootstrap();
