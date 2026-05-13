import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Creneau, CreneauSchema } from './creneau.schema';
import { PlanningController } from './planning.controller';
import { PlanningService } from './planning.service';

@Module({
  imports: [MongooseModule.forFeature([{ name: Creneau.name, schema: CreneauSchema }])],
  controllers: [PlanningController],
  providers: [PlanningService],
  exports: [PlanningService, MongooseModule],
})
export class PlanningModule {}
