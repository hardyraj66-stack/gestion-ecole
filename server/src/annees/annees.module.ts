import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AnneeScolaire, AnneeScolaireSchema } from './annee.schema';
import { Classe, ClasseSchema } from '../classes/classe.schema';
import { Eleve, EleveSchema } from '../eleves/eleve.schema';
import { Matiere, MatiereSchema } from '../matieres/matiere.schema';
import { Note, NoteSchema } from '../notes/note.schema';
import { Creneau, CreneauSchema } from '../planning/creneau.schema';
import { PeriodesModule } from '../periodes/periodes.module';
import { AnneesController } from './annees.controller';
import { AnneesService } from './annees.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: AnneeScolaire.name, schema: AnneeScolaireSchema },
      { name: Classe.name, schema: ClasseSchema },
      { name: Eleve.name, schema: EleveSchema },
      { name: Matiere.name, schema: MatiereSchema },
      { name: Note.name, schema: NoteSchema },
      { name: Creneau.name, schema: CreneauSchema },
    ]),
    PeriodesModule,
  ],
  controllers: [AnneesController],
  providers: [AnneesService],
  exports: [AnneesService, MongooseModule],
})
export class AnneesModule {}
