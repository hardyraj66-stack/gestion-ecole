import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { ClassesModule } from './classes/classes.module';
import { ElevesModule } from './eleves/eleves.module';
import { MatieresModule } from './matieres/matieres.module';
import { NotesModule } from './notes/notes.module';
import { PlanningModule } from './planning/planning.module';
import { SallesModule } from './salles/salles.module';
import { AnneesModule } from './annees/annees.module';
import { ReadModule } from './read/read.module';
import { SuiviModule } from './suivi/suivi.module';
import { ExclusionsModule } from './exclusions/exclusions.module';
import { DepartsModule } from './departs/departs.module';
import { NiveauxModule } from './niveaux/niveaux.module';
import { ProfesseursModule } from './professeurs/professeurs.module';
import { TeacherAssignmentsModule } from './teacher-assignments/teacher-assignments.module';
import { PlanningExecutionsModule } from './planning-executions/planning-executions.module';
import { EvaluationsModule } from './evaluations/evaluations.module';
import { PeriodesModule } from './periodes/periodes.module';
import { EventsModule } from './events/events.module';
import { SeederModule } from './data/seeder.module';
import { ExportModule } from './export/export.module';
import { MigrationModule } from './migration/migration.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { AuditModule } from './audit/audit.module';
import { ApiLoggerMiddleware } from './common/api-logger.middleware';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/gestion-ecole';

// En production, le frontend (build mono-fichier) est servi par ce serveur.
// Le préfixe /api (cf. main.ts) garantit qu'aucune route API n'est avalée par
// le service statique ; les routes inconnues retombent sur index.html (SPA).
const STATIC_ROOT = process.env.STATIC_ROOT || join(__dirname, '..', 'public');
const serveStatic =
  process.env.NODE_ENV === 'production'
    ? [
        ServeStaticModule.forRoot({
          rootPath: STATIC_ROOT,
          exclude: ['/api/(.*)'],
        }),
      ]
    : [];

@Module({
  imports: [
    ...serveStatic,
    MongooseModule.forRoot(MONGO_URI),
    EventsModule,
    AuditModule,
    AuthModule,
    UsersModule,
    SeederModule,
    MigrationModule,
    ReadModule,
    AnneesModule,
    ClassesModule,
    ElevesModule,
    MatieresModule,
    NotesModule,
    PlanningModule,
    SallesModule,
    SuiviModule,
    ExclusionsModule,
    DepartsModule,
    NiveauxModule,
    ProfesseursModule,
    TeacherAssignmentsModule,
    PlanningExecutionsModule,
    EvaluationsModule,
    PeriodesModule,
    ExportModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(ApiLoggerMiddleware).forRoutes('*');
  }
}
