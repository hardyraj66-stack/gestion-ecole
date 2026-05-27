import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

const t = (_: any, ret: Record<string, any>) => {
  ret.id = ret._id; delete ret._id; delete ret.__v; return ret;
};

@Schema({ timestamps: true, toJSON: { virtuals: true, transform: t } })
export class Avertissement extends Document {
  @Prop({ required: true }) eleve_id: string;
  @Prop({ required: true }) motif: string;
  /** @deprecated Utiliser anneeScolaireId — conservé pour doublon temporaire */
  @Prop({ required: false, default: '' }) annee_scolaire: string;
  /** Référence ID vers la collection AnneeScolaire */
  @Prop({ required: false, default: '' }) anneeScolaireId: string;
  @Prop({ required: true }) date: string;
  @Prop({ default: '' }) commentaire: string;
  @Prop({ required: true, enum: ['comportement', 'degats', 'absence', 'autre'], default: 'comportement' }) type: string;
}

export const AvertissementSchema = SchemaFactory.createForClass(Avertissement);
AvertissementSchema.index({ eleve_id: 1 });
AvertissementSchema.index({ eleve_id: 1, annee_scolaire: 1 });
AvertissementSchema.index({ eleve_id: 1, anneeScolaireId: 1 });
