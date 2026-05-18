import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EleveQuitte, EleveQuitteSchema } from './depart.schema';
import { Eleve, EleveSchema } from '../eleves/eleve.schema';
import { DepartsService } from './departs.service';
import { DepartsController } from './departs.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: EleveQuitte.name, schema: EleveQuitteSchema },
      { name: Eleve.name, schema: EleveSchema },
    ]),
  ],
  controllers: [DepartsController],
  providers: [DepartsService],
  exports: [DepartsService],
})
export class DepartsModule {}
