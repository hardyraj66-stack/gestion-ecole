import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
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
import { ApiLoggerMiddleware } from './common/api-logger.middleware';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/gestion-ecole';

@Module({
  imports: [
    MongooseModule.forRoot(MONGO_URI),
    EventsModule,
    SeederModule,
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
