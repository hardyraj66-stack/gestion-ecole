import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Niveau, NiveauSchema } from './niveau.schema';
import { Classe, ClasseSchema } from '../classes/classe.schema';
import { NiveauxController } from './niveaux.controller';
import { NiveauxService } from './niveaux.service';

@Module({
  imports: [MongooseModule.forFeature([
    { name: Niveau.name, schema: NiveauSchema },
    { name: Classe.name, schema: ClasseSchema },
  ])],
  controllers: [NiveauxController],
  providers: [NiveauxService],
  exports: [NiveauxService, MongooseModule],
})
export class NiveauxModule {}
