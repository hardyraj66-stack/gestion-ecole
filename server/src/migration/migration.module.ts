import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MigrationService } from './migration.service';
import { Eleve, EleveSchema } from '../eleves/eleve.schema';
import { Classe, ClasseSchema } from '../classes/classe.schema';
import { Absence, AbsenceSchema } from '../suivi/absence.schema';
import { Convocation, ConvocationSchema } from '../suivi/convocation.schema';
import { AnneeScolaire, AnneeScolaireSchema } from '../annees/annee.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Eleve.name, schema: EleveSchema },
      { name: Classe.name, schema: ClasseSchema },
      { name: Absence.name, schema: AbsenceSchema },
      { name: Convocation.name, schema: ConvocationSchema },
      { name: AnneeScolaire.name, schema: AnneeScolaireSchema },
    ]),
  ],
  providers: [MigrationService],
})
export class MigrationModule {}
