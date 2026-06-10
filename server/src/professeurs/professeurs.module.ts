import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Professeur, ProfesseurSchema } from './professeur.schema';
import { TeacherAssignment, TeacherAssignmentSchema } from '../teacher-assignments/teacher-assignment.schema';
import { ProfesseursController } from './professeurs.controller';
import { ProfesseursService } from './professeurs.service';
import { UsersModule } from '../users/users.module';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Professeur.name, schema: ProfesseurSchema },
      { name: TeacherAssignment.name, schema: TeacherAssignmentSchema },
    ]),
    UsersModule,
    MailModule,
  ],
  controllers: [ProfesseursController],
  providers: [ProfesseursService],
  exports: [ProfesseursService, MongooseModule],
})
export class ProfesseursModule {}
