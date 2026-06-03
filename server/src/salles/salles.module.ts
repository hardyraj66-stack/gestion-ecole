import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Salle, SalleSchema } from './salle.schema';
import { AnneeScolaire, AnneeScolaireSchema } from '../annees/annee.schema';
import { PlanningModule } from '../planning/planning.module';
import { ClassesModule } from '../classes/classes.module';
import { SallesController } from './salles.controller';
import { SallesService } from './salles.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Salle.name, schema: SalleSchema },
      { name: AnneeScolaire.name, schema: AnneeScolaireSchema },
    ]),
    PlanningModule,
    ClassesModule,
  ],
  controllers: [SallesController],
  providers: [SallesService],
  exports: [SallesService],
})
export class SallesModule {}
