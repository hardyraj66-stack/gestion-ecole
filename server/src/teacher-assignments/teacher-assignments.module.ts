import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TeacherAssignment, TeacherAssignmentSchema } from './teacher-assignment.schema';
import { Professeur, ProfesseurSchema } from '../professeurs/professeur.schema';
import { TeacherAssignmentsController } from './teacher-assignments.controller';
import { TeacherAssignmentsService } from './teacher-assignments.service';

@Module({
  imports: [MongooseModule.forFeature([
    { name: TeacherAssignment.name, schema: TeacherAssignmentSchema },
    { name: Professeur.name, schema: ProfesseurSchema },
  ])],
  controllers: [TeacherAssignmentsController],
  providers: [TeacherAssignmentsService],
  exports: [TeacherAssignmentsService, MongooseModule],
})
export class TeacherAssignmentsModule {}
