import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true, toJSON: { virtuals: true, transform: (_, ret) => { ret._id = ret._id; delete ret._id; delete ret.__v; return ret; } } })
export class Note extends Document {
  @Prop({ required: true })
  eleve_id: string;

  @Prop({ required: true })
  matiere_id: string;

  @Prop({ required: true })
  valeur: number;

  @Prop({ required: true, enum: [1, 2, 3], default: 1 })
  trimestre: number;

  @Prop({ required: true })
  date: string;

  @Prop()
  commentaire: string;
}

export const NoteSchema = SchemaFactory.createForClass(Note);
