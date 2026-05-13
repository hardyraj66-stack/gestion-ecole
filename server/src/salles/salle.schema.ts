import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true, toJSON: { virtuals: true, transform: (_, ret) => { ret._id = ret._id; delete ret._id; delete ret.__v; return ret; } } })
export class Salle extends Document {
  @Prop({ required: true })
  nom: string;

  @Prop({ required: true, default: 30 })
  capacite: number;

  @Prop({ default: '' })
  description: string;

  @Prop({ required: true, enum: ['standard', 'laboratoire', 'informatique', 'sport', 'arts'], default: 'standard' })
  type: string;
}

export const SalleSchema = SchemaFactory.createForClass(Salle);
