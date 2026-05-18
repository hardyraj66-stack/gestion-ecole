import { Module, Global } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Classe, ClasseSchema } from '../classes/classe.schema';
import { Eleve, EleveSchema } from '../eleves/eleve.schema';
import { Matiere, MatiereSchema } from '../matieres/matiere.schema';
import { Note, NoteSchema } from '../notes/note.schema';
import { Creneau, CreneauSchema } from '../planning/creneau.schema';
import { Salle, SalleSchema } from '../salles/salle.schema';
import { AnneeScolaire, AnneeScolaireSchema } from '../annees/annee.schema';
import { Convocation, ConvocationSchema } from '../suivi/convocation.schema';
import { ReadClasse, ReadClasseSchema } from './schemas/read-classe.schema';
import { ReadEleve, ReadEleveSchema } from './schemas/read-eleve.schema';
import { ReadMatiere, ReadMatiereSchema } from './schemas/read-matiere.schema';
import { ReadNote, ReadNoteSchema } from './schemas/read-note.schema';
import { ReadCreneau, ReadCreneauSchema } from './schemas/read-creneau.schema';
import { ReadSalle, ReadSalleSchema } from './schemas/read-salle.schema';
import { ReadController } from './read.controller';
import { ReadService } from './read.service';
import { ViewBuilderService } from './view-builder.service';

@Global()
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
      { name: Convocation.name, schema: ConvocationSchema },
      { name: ReadClasse.name, schema: ReadClasseSchema },
      { name: ReadEleve.name, schema: ReadEleveSchema },
      { name: ReadMatiere.name, schema: ReadMatiereSchema },
      { name: ReadNote.name, schema: ReadNoteSchema },
      { name: ReadCreneau.name, schema: ReadCreneauSchema },
      { name: ReadSalle.name, schema: ReadSalleSchema },
    ]),
  ],
  controllers: [ReadController],
  providers: [ReadService, ViewBuilderService],
  exports: [ViewBuilderService],
})
export class ReadModule {}
