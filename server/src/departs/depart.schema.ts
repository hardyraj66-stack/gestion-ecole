import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

const t = (_: any, ret: Record<string, any>) => {
  ret.id = ret._id; delete ret._id; delete ret.__v; return ret;
};

// Collection dédiée aux élèves ayant quitté l'établissement (départ volontaire/administratif)
@Schema({ timestamps: true, toJSON: { virtuals: true, transform: t } })
export class EleveQuitte extends Document {
  @Prop({ required: true }) eleve_id: string;
  @Prop({ required: true }) nom: string;
  @Prop({ required: true }) prenom: string;
  @Prop({ required: true }) classe_id: string;
  @Prop({ required: true }) classe_nom: string;
  @Prop({ required: true }) date_depart: string;
  @Prop({ required: true }) raison: string;
  @Prop({ default: '' }) commentaire: string;
  @Prop({ required: true, enum: ['changement_ecole', 'demenagement', 'raison_familiale', 'autre'] })
  motif: string;
  @Prop({ required: true }) annee_scolaire: string;
}

export const EleveQuitteSchema = SchemaFactory.createForClass(EleveQuitte);
EleveQuitteSchema.index({ eleve_id: 1 });
EleveQuitteSchema.index({ eleve_id: 1, annee_scolaire: 1 });
