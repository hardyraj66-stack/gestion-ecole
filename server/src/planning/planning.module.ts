import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Creneau, CreneauSchema } from './creneau.schema';
import { PlanningController } from './planning.controller';
import { PlanningService } from './planning.service';
import { NiveauxModule } from '../niveaux/niveaux.module';
import { ClassesModule } from '../classes/classes.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Creneau.name, schema: CreneauSchema }]),
    NiveauxModule,
    ClassesModule,
  ],
  controllers: [PlanningController],
  providers: [PlanningService],
  exports: [PlanningService, MongooseModule],
})
export class PlanningModule {}
