import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Matiere, MatiereSchema } from './matiere.schema';
import { Note, NoteSchema } from '../notes/note.schema';
import { Creneau, CreneauSchema } from '../planning/creneau.schema';
import { MatieresController } from './matieres.controller';
import { MatieresService } from './matieres.service';

@Module({
  imports: [MongooseModule.forFeature([
    { name: Matiere.name, schema: MatiereSchema },
    { name: Note.name, schema: NoteSchema },
    { name: Creneau.name, schema: CreneauSchema },
  ])],
  controllers: [MatieresController],
  providers: [MatieresService],
  exports: [MatieresService, MongooseModule],
})
export class MatieresModule {}
