import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PlanningExecution, PlanningExecutionSchema } from './planning-execution.schema';
import { PlanningExecutionsController } from './planning-executions.controller';
import { PlanningExecutionsService } from './planning-executions.service';

@Module({
  imports: [MongooseModule.forFeature([{ name: PlanningExecution.name, schema: PlanningExecutionSchema }])],
  controllers: [PlanningExecutionsController],
  providers: [PlanningExecutionsService],
  exports: [PlanningExecutionsService, MongooseModule],
})
export class PlanningExecutionsModule {}
