import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

const toJsonTransform = (_: any, ret: Record<string, any>) => {
  ret.id = ret._id;
  delete ret._id;
  delete ret.__v;
  return ret;
};

@Schema({ timestamps: true, toJSON: { virtuals: true, transform: toJsonTransform } })
export class Professeur extends Document {
  @Prop({ required: true })
  nom: string;

  @Prop({ required: true })
  prenom: string;

  @Prop({ default: '' })
  email: string;

  @Prop({ default: '' })
  telephone: string;

  @Prop({ required: true, enum: ['M', 'F'] })
  genre: string;

  @Prop({ default: 'actif', enum: ['actif', 'inactif'] })
  statut: string;
}

export const ProfesseurSchema = SchemaFactory.createForClass(Professeur);
ProfesseurSchema.index({ statut: 1 });
ProfesseurSchema.index({ nom: 1 });
