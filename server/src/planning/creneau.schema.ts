import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

const toJsonTransform = (_: any, ret: Record<string, any>) => {
  ret.id = ret._id;
  delete ret._id;
  delete ret.__v;
  return ret;
};

@Schema({ timestamps: true, toJSON: { virtuals: true, transform: toJsonTransform } })
export class Creneau extends Document {
  @Prop({ required: true })
  classe_id: string;

  @Prop({ required: true })
  matiere_id: string;

  @Prop({ required: true })
  matiere_nom: string;

  @Prop({ default: '#2563eb' })
  matiere_couleur: string;

  @Prop({ required: true, enum: ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'] })
  jour: string;

  @Prop({ required: true })
  heure_debut: string;

  @Prop({ required: true })
  heure_fin: string;

  @Prop({ required: true })
  salle: string;
}

export const CreneauSchema = SchemaFactory.createForClass(Creneau);
CreneauSchema.index({ classe_id: 1 });
CreneauSchema.index({ salle: 1, jour: 1 });
CreneauSchema.index({ matiere_id: 1 });
