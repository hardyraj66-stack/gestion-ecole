import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

const toJsonTransform = (_: any, ret: Record<string, any>) => {
  ret.id = ret._id;
  delete ret._id;
  delete ret.__v;
  return ret;
};

@Schema({ timestamps: true, toJSON: { virtuals: true, transform: toJsonTransform } })
export class PlanningExecution extends Document {
  @Prop({ required: true })
  creneau_id: string;

  @Prop({ required: true })
  annee_id: string;

  @Prop({ required: true })
  classe_id: string;

  @Prop({ required: true })
  matiere_id: string;

  @Prop({ required: true })
  professeur_id: string;

  @Prop({ default: '' })
  prof_remplacant_id: string;

  @Prop({ required: true })
  date: string;

  @Prop({ required: true })
  heure_debut: string;

  @Prop({ required: true })
  heure_fin: string;

  @Prop({ required: true })
  salle: string;

  @Prop({ default: 'planifie', enum: ['planifie', 'effectue', 'annule', 'remplacement'] })
  statut: string;

  @Prop({ default: '' })
  motif_annulation: string;
}

export const PlanningExecutionSchema = SchemaFactory.createForClass(PlanningExecution);
PlanningExecutionSchema.index({ classe_id: 1, date: 1 });
PlanningExecutionSchema.index({ professeur_id: 1, date: 1 });
