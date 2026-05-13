import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Note, NoteSchema } from './note.schema';
import { MatieresModule } from '../matieres/matieres.module';
import { NotesController } from './notes.controller';
import { NotesService } from './notes.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Note.name, schema: NoteSchema }]),
    MatieresModule,
  ],
  controllers: [NotesController],
  providers: [NotesService],
  exports: [NotesService, MongooseModule],
})
export class NotesModule {}
