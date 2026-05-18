import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Avertissement, AvertissementSchema } from './avertissement.schema';
import { Absence, AbsenceSchema } from './absence.schema';
import { SuiviService } from './suivi.service';
import { SuiviController } from './suivi.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Avertissement.name, schema: AvertissementSchema },
      { name: Absence.name, schema: AbsenceSchema },
    ]),
  ],
  controllers: [SuiviController],
  providers: [SuiviService],
  exports: [SuiviService],
})
export class SuiviModule {}
