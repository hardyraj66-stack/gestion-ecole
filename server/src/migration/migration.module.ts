import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MigrationService } from './migration.service';
import { Eleve, EleveSchema } from '../eleves/eleve.schema';
import { Classe, ClasseSchema } from '../classes/classe.schema';
import { Absence, AbsenceSchema } from '../suivi/absence.schema';
import { Convocation, ConvocationSchema } from '../suivi/convocation.schema';
import { AnneeScolaire, AnneeScolaireSchema } from '../annees/annee.schema';
import { Niveau, NiveauSchema } from '../niveaux/niveau.schema';
import { Salle, SalleSchema } from '../salles/salle.schema';
import { Matiere, MatiereSchema } from '../matieres/matiere.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Eleve.name, schema: EleveSchema },
      { name: Classe.name, schema: ClasseSchema },
      { name: Absence.name, schema: AbsenceSchema },
      { name: Convocation.name, schema: ConvocationSchema },
      { name: AnneeScolaire.name, schema: AnneeScolaireSchema },
      { name: Niveau.name, schema: NiveauSchema },
      { name: Salle.name, schema: SalleSchema },
      { name: Matiere.name, schema: MatiereSchema },
    ]),
  ],
  providers: [MigrationService],
})
export class MigrationModule {}
