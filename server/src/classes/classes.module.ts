import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Classe, ClasseSchema } from './classe.schema';
import { Eleve, EleveSchema } from '../eleves/eleve.schema';
import { ClassesController } from './classes.controller';
import { ClassesService } from './classes.service';

@Module({
  imports: [MongooseModule.forFeature([
    { name: Classe.name, schema: ClasseSchema },
    { name: Eleve.name, schema: EleveSchema },
  ])],
  controllers: [ClassesController],
  providers: [ClassesService],
  exports: [ClassesService, MongooseModule],
})
export class ClassesModule {}
