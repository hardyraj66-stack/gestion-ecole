import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Professeur, ProfesseurSchema } from './professeur.schema';
import { ProfesseursController } from './professeurs.controller';
import { ProfesseursService } from './professeurs.service';

@Module({
  imports: [MongooseModule.forFeature([{ name: Professeur.name, schema: ProfesseurSchema }])],
  controllers: [ProfesseursController],
  providers: [ProfesseursService],
  exports: [ProfesseursService, MongooseModule],
})
export class ProfesseursModule {}
