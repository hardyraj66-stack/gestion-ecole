import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Niveau, NiveauSchema } from './niveau.schema';
import { Classe, ClasseSchema } from '../classes/classe.schema';
import { Matiere, MatiereSchema } from '../matieres/matiere.schema';
import { AnneeScolaire, AnneeScolaireSchema } from '../annees/annee.schema';
import { NiveauxController } from './niveaux.controller';
import { NiveauxService } from './niveaux.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Niveau.name, schema: NiveauSchema },
      { name: Classe.name, schema: ClasseSchema },
      { name: Matiere.name, schema: MatiereSchema },
      { name: AnneeScolaire.name, schema: AnneeScolaireSchema },
    ]),
  ],
  controllers: [NiveauxController],
  providers: [NiveauxService],
  exports: [NiveauxService, MongooseModule],
})
export class NiveauxModule {}
