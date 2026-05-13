import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ClassesModule } from './classes/classes.module';
import { ElevesModule } from './eleves/eleves.module';
import { MatieresModule } from './matieres/matieres.module';
import { NotesModule } from './notes/notes.module';
import { PlanningModule } from './planning/planning.module';
import { SallesModule } from './salles/salles.module';
import { AnneesModule } from './annees/annees.module';
import { EventsModule } from './events/events.module';
import { SeederModule } from './data/seeder.module';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/gestion-ecole';

@Module({
  imports: [
    MongooseModule.forRoot(MONGO_URI),
    EventsModule,
    SeederModule,
    AnneesModule,
    ClassesModule,
    ElevesModule,
    MatieresModule,
    NotesModule,
    PlanningModule,
    SallesModule,
  ],
})
export class AppModule {}
