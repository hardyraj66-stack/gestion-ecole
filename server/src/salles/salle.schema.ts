import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

const toJsonTransform = (_: any, ret: Record<string, any>) => {
  ret.id = ret._id;
  delete ret._id;
  delete ret.__v;
  return ret;
};

export type TypeSalle = 'standard' | 'laboratoire' | 'informatique' | 'sport' | 'arts' | 'amphi' | 'autre';
export type Equipement = 'projecteur' | 'ordinateurs' | 'tableau_interactif' | 'labo_scientifique' | 'sono' | 'climatisation';

@Schema({ timestamps: true, toJSON: { virtuals: true, transform: toJsonTransform } })
export class Salle extends Document {
  @Prop({ required: true })
  nom: string;

  @Prop({ required: true, default: 30 })
  capacite: number;

  @Prop({ default: '' })
  description: string;

  @Prop({ required: true, enum: ['standard', 'laboratoire', 'informatique', 'sport', 'arts', 'amphi', 'autre'], default: 'standard' })
  type: string;

  @Prop({ type: [String], default: [] })
  equipements: string[];

  @Prop({ default: false })
  accessible_pmr: boolean;

  @Prop({ default: '' })
  batiment: string;

  @Prop({ default: '' })
  etage: string;

  @Prop({ default: true })
  actif: boolean;

  /** Référence ID vers la collection AnneeScolaire — isole les salles par année */
  @Prop({ default: '' })
  anneeScolaireId: string;
}

export const SalleSchema = SchemaFactory.createForClass(Salle);
SalleSchema.index({ anneeScolaireId: 1 });
