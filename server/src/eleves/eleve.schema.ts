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

  // Famille
  @Prop({ type: { nom: String, prenom: String, telephone: String, email: String, statut: { type: String, enum: ['vivant', 'decede'], default: 'vivant' } }, default: null })
  pere: { nom: string; prenom: string; telephone: string; email: string; statut: 'vivant' | 'decede' } | null;

  @Prop({ type: { nom: String, prenom: String, telephone: String, email: String, statut: { type: String, enum: ['vivant', 'decede'], default: 'vivant' } }, default: null })
  mere: { nom: string; prenom: string; telephone: string; email: string; statut: 'vivant' | 'decede' } | null;

  @Prop({ type: { nom: String, prenom: String, telephone: String, email: String, lien: String }, default: null })
  tuteur: { nom: string; prenom: string; telephone: string; email: string; lien: string } | null;
}

export const EleveSchema = SchemaFactory.createForClass(Eleve);
