import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

const toJsonTransform = (_: any, ret: Record<string, any>) => {
  ret.id = ret._id;
  delete ret._id;
  delete ret.__v;
  return ret;
};

@Schema({ timestamps: true, toJSON: { virtuals: true, transform: toJsonTransform } })
export class Niveau extends Document {
  @Prop({ required: true, unique: true })
  nom: string;

  @Prop({ required: true, default: 0 })
  ordre: number;

  @Prop({ default: '' })
  description: string;

  @Prop({ type: [String], default: [] })
  matiere_ids: string[];
}

export const NiveauSchema = SchemaFactory.createForClass(Niveau);
