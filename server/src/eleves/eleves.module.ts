import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Eleve, EleveSchema } from './eleve.schema';
import { ElevesController } from './eleves.controller';
import { ElevesService } from './eleves.service';

@Module({
  imports: [MongooseModule.forFeature([{ name: Eleve.name, schema: EleveSchema }])],
  controllers: [ElevesController],
  providers: [ElevesService],
  exports: [ElevesService, MongooseModule],
})
export class ElevesModule {}
