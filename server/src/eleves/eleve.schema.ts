import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

const toJsonTransform = (_: any, ret: Record<string, any>) => {
  ret.id = ret._id;
  delete ret._id;
  delete ret.__v;
  return ret;
};

@Schema({ timestamps: true, toJSON: { virtuals: true, transform: toJsonTransform } })
export class Eleve extends Document {
  @Prop({ required: true })
  nom: string;

  @Prop({ required: true })
  prenom: string;

  @Prop({ required: true })
  date_naissance: string;

  @Prop({ required: true, enum: ['M', 'F'] })
  genre: string;

  @Prop({ required: true })
  classe_id: string;

  @Prop()
  email: string;

  @Prop()
  telephone: string;

  @Prop()
  adresse: string;
}

export const EleveSchema = SchemaFactory.createForClass(Eleve);
