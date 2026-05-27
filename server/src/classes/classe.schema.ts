import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

const toJsonTransform = (_: any, ret: Record<string, any>) => {
  ret.id = ret._id;
  delete ret._id;
  delete ret.__v;
  return ret;
};

@Schema({ timestamps: true, toJSON: { virtuals: true, transform: toJsonTransform } })
export class Classe extends Document {
  @Prop({ required: true })
  nom: string;

  @Prop({ required: true })
  niveau: string;

  /** @deprecated Utiliser anneeScolaireId — conservé pour doublon temporaire et affichage */
  @Prop({ required: false, default: '' })
  annee_scolaire: string;

  /** Référence ID vers la collection AnneeScolaire */
  @Prop({ required: false, default: '' })
  anneeScolaireId: string;

  @Prop({ required: true, default: 30 })
  capacite: number;

  @Prop({ default: '' })
  salle: string;

  @Prop({ required: true, enum: ['fixe', 'variable'], default: 'fixe' })
  salle_type: string;

  @Prop({ default: true })
  actif: boolean;
}

export const ClasseSchema = SchemaFactory.createForClass(Classe);
ClasseSchema.index({ annee_scolaire: 1 });
ClasseSchema.index({ annee_scolaire: 1, actif: 1 });
ClasseSchema.index({ anneeScolaireId: 1 });
ClasseSchema.index({ anneeScolaireId: 1, actif: 1 });
ClasseSchema.index({ salle: 1, salle_type: 1, actif: 1 });
ClasseSchema.index({ niveau: 1, actif: 1 });
