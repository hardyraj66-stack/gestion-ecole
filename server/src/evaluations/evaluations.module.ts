import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Evaluation, EvaluationSchema } from './evaluation.schema';
import { Eleve, EleveSchema } from '../eleves/eleve.schema';
import { Classe, ClasseSchema } from '../classes/classe.schema';
import { EvaluationsController } from './evaluations.controller';
import { EvaluationsService } from './evaluations.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Evaluation.name, schema: EvaluationSchema },
      { name: Eleve.name, schema: EleveSchema },
      { name: Classe.name, schema: ClasseSchema },
    ]),
  ],
  controllers: [EvaluationsController],
  providers: [EvaluationsService],
  exports: [EvaluationsService, MongooseModule],
})
export class EvaluationsModule {}
