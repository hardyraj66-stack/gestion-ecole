import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ReadClasse, ReadClasseSchema } from '../read/schemas/read-classe.schema';
import { ReadEleve, ReadEleveSchema } from '../read/schemas/read-eleve.schema';
import { ReadMatiere, ReadMatiereSchema } from '../read/schemas/read-matiere.schema';
import { ReadNote, ReadNoteSchema } from '../read/schemas/read-note.schema';
import { ReadSalle, ReadSalleSchema } from '../read/schemas/read-salle.schema';
import { ReadEvaluation, ReadEvaluationSchema } from '../read/schemas/read-evaluation.schema';
import { Professeur, ProfesseurSchema } from '../professeurs/professeur.schema';
import { AnneeScolaire, AnneeScolaireSchema } from '../annees/annee.schema';
import { Niveau, NiveauSchema } from '../niveaux/niveau.schema';
import { TeacherAssignment, TeacherAssignmentSchema } from '../teacher-assignments/teacher-assignment.schema';
import { ExportController } from './export.controller';
import { ExportService } from './export.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ReadClasse.name, schema: ReadClasseSchema },
      { name: ReadEleve.name, schema: ReadEleveSchema },
      { name: ReadMatiere.name, schema: ReadMatiereSchema },
      { name: ReadNote.name, schema: ReadNoteSchema },
      { name: ReadSalle.name, schema: ReadSalleSchema },
      { name: ReadEvaluation.name, schema: ReadEvaluationSchema },
      { name: Professeur.name, schema: ProfesseurSchema },
      { name: AnneeScolaire.name, schema: AnneeScolaireSchema },
      { name: Niveau.name, schema: NiveauSchema },
      { name: TeacherAssignment.name, schema: TeacherAssignmentSchema },
    ]),
  ],
  controllers: [ExportController],
  providers: [ExportService],
})
export class ExportModule {}
