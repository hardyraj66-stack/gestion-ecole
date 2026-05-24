import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TeacherAssignment, TeacherAssignmentSchema } from './teacher-assignment.schema';
import { Professeur, ProfesseurSchema } from '../professeurs/professeur.schema';
import { Classe, ClasseSchema } from '../classes/classe.schema';
import { TeacherAssignmentsController } from './teacher-assignments.controller';
import { TeacherAssignmentsService } from './teacher-assignments.service';
import { NiveauxModule } from '../niveaux/niveaux.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: TeacherAssignment.name, schema: TeacherAssignmentSchema },
      { name: Professeur.name, schema: ProfesseurSchema },
      { name: Classe.name, schema: ClasseSchema },
    ]),
    NiveauxModule,
  ],
  controllers: [TeacherAssignmentsController],
  providers: [TeacherAssignmentsService],
  exports: [TeacherAssignmentsService, MongooseModule],
})
export class TeacherAssignmentsModule {}
