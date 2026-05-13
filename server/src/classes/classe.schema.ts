import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true, toJSON: { virtuals: true, transform: (_, ret) => { ret._id = ret._id; delete ret._id; delete ret.__v; return ret; } } })
export class Classe extends Document {
  @Prop({ required: true })
  nom: string;

  @Prop({ required: true })
  niveau: string;

  @Prop({ required: true })
  annee_scolaire: string;

  @Prop({ required: true, default: 30 })
  capacite: number;

  @Prop({ required: true })
  salle: string;

  @Prop({ required: true, enum: ['fixe', 'variable'], default: 'fixe' })
  salle_type: string;
}

export const ClasseSchema = SchemaFactory.createForClass(Classe);
