import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EleveExclu, EleveExcluSchema } from './exclusion.schema';
import { Eleve, EleveSchema } from '../eleves/eleve.schema';
import { Classe, ClasseSchema } from '../classes/classe.schema';
import { ExclusionsService } from './exclusions.service';
import { ExclusionsController } from './exclusions.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: EleveExclu.name, schema: EleveExcluSchema },
      { name: Eleve.name, schema: EleveSchema },
      { name: Classe.name, schema: ClasseSchema },
    ]),
  ],
  controllers: [ExclusionsController],
  providers: [ExclusionsService],
  exports: [ExclusionsService],
})
export class ExclusionsModule {}
