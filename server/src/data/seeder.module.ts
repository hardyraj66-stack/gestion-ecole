import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SeederService } from './seeder.service';
import { DevController } from './dev.controller';
import { Classe, ClasseSchema } from '../classes/classe.schema';
import { Eleve, EleveSchema } from '../eleves/eleve.schema';
import { Matiere, MatiereSchema } from '../matieres/matiere.schema';
import { Note, NoteSchema } from '../notes/note.schema';
import { Creneau, CreneauSchema } from '../planning/creneau.schema';
import { Salle, SalleSchema } from '../salles/salle.schema';
import { AnneeScolaire, AnneeScolaireSchema } from '../annees/annee.schema';
import { Niveau, NiveauSchema } from '../niveaux/niveau.schema';
import { Professeur, ProfesseurSchema } from '../professeurs/professeur.schema';
import { TeacherAssignment, TeacherAssignmentSchema } from '../teacher-assignments/teacher-assignment.schema';
import { PeriodeEvaluation, PeriodeEvaluationSchema } from '../periodes/periode.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Classe.name, schema: ClasseSchema },
      { name: Eleve.name, schema: EleveSchema },
      { name: Matiere.name, schema: MatiereSchema },
      { name: Note.name, schema: NoteSchema },
      { name: Creneau.name, schema: CreneauSchema },
      { name: Salle.name, schema: SalleSchema },
      { name: AnneeScolaire.name, schema: AnneeScolaireSchema },
      { name: Niveau.name, schema: NiveauSchema },
      { name: Professeur.name, schema: ProfesseurSchema },
      { name: TeacherAssignment.name, schema: TeacherAssignmentSchema },
      { name: PeriodeEvaluation.name, schema: PeriodeEvaluationSchema },
    ]),
  ],
  providers: [SeederService],
  controllers: [DevController],
})
export class SeederModule {}
