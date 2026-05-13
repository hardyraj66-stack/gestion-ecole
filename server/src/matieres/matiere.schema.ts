import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true, toJSON: { virtuals: true, transform: (_, ret) => { ret._id = ret._id; delete ret._id; delete ret.__v; return ret; } } })
export class Matiere extends Document {
  @Prop({ required: true })
  nom: string;

  @Prop({ required: true })
  code: string;

  @Prop({ required: true, default: 1 })
  coefficient: number;

  @Prop()
  description: string;

  @Prop()
  couleur: string;
}

export const MatiereSchema = SchemaFactory.createForClass(Matiere);
