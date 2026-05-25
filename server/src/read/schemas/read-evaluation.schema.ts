import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

const t = (_: any, ret: Record<string, any>) => {
  ret.id = ret.source_id;
  delete ret._id; delete ret.__v; delete ret.source_id;
  return ret;
};

@Schema({ collection: 'read_evaluations', timestamps: true, toJSON: { virtuals: true, transform: t } })
export class ReadEvaluation extends Document {
  @Prop({ required: true }) source_id: string;
  @Prop({ default: '' }) type: string;
  @Prop({ default: '' }) classe_id: string;
  @Prop({ default: '' }) classe_nom: string;
  @Prop({ default: '' }) classe_niveau: string;
  @Prop({ default: '' }) matiere_id: string;
  @Prop({ default: '' }) matiere_nom: string;
  @Prop({ default: '' }) matiere_code: string;
  @Prop({ default: 1 }) trimestre: number;
  @Prop({ default: '' }) annee_scolaire: string;
  @Prop({ default: '' }) date: string;
  @Prop({ default: 'brouillon' }) statut: string;
  @Prop({ type: [Object], default: [] })
  notes: Array<{
    eleve_id: string;
    eleve_nom: string;
    eleve_prenom: string;
    valeur: number | null;
    absent: boolean;
  }>;
  @Prop({ default: 0 }) nb_notes_saisies: number;
  @Prop({ default: 0 }) nb_eleves: number;
  @Prop({ default: null }) moyenne_classe: number | null;
}

export const ReadEvaluationSchema = SchemaFactory.createForClass(ReadEvaluation);
ReadEvaluationSchema.index({ source_id: 1 }, { unique: true });
ReadEvaluationSchema.index({ classe_id: 1, trimestre: 1 });
ReadEvaluationSchema.index({ statut: 1 });
