import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PeriodeEvaluation, PeriodeEvaluationSchema } from './periode.schema';
import { PeriodesController } from './periodes.controller';
import { PeriodesService } from './periodes.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PeriodeEvaluation.name, schema: PeriodeEvaluationSchema },
    ]),
  ],
  controllers: [PeriodesController],
  providers: [PeriodesService],
  exports: [PeriodesService, MongooseModule],
})
export class PeriodesModule {}
