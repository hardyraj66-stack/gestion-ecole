import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Note, NoteSchema } from './note.schema';
import { Eleve, EleveSchema } from '../eleves/eleve.schema';
import { Classe, ClasseSchema } from '../classes/classe.schema';
import { MatieresModule } from '../matieres/matieres.module';
import { PeriodesModule } from '../periodes/periodes.module';
import { NotesController } from './notes.controller';
import { NotesService } from './notes.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Note.name, schema: NoteSchema },
      { name: Eleve.name, schema: EleveSchema },
      { name: Classe.name, schema: ClasseSchema },
    ]),
    MatieresModule,
    PeriodesModule,
  ],
  controllers: [NotesController],
  providers: [NotesService],
  exports: [NotesService, MongooseModule],
})
export class NotesModule {}
