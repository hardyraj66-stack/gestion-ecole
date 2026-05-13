import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Matiere, MatiereSchema } from './matiere.schema';
import { MatieresController } from './matieres.controller';
import { MatieresService } from './matieres.service';

@Module({
  imports: [MongooseModule.forFeature([{ name: Matiere.name, schema: MatiereSchema }])],
  controllers: [MatieresController],
  providers: [MatieresService],
  exports: [MatieresService, MongooseModule],
})
export class MatieresModule {}
