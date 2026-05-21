import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

const t = (_: any, ret: Record<string, any>) => {
  ret.id = ret.source_id;
  delete ret._id; delete ret.__v; delete ret.source_id;
  return ret;
};

@Schema({ collection: 'read_creneaux', timestamps: true, toJSON: { virtuals: true, transform: t } })
export class ReadCreneau extends Document {
  @Prop({ required: true }) source_id: string;
  @Prop() classe_id: string;
  @Prop() matiere_id: string;
  @Prop() matiere_nom: string;
  @Prop() matiere_couleur: string;
  @Prop() jour: string;
  @Prop() heure_debut: string;
  @Prop() heure_fin: string;
  @Prop() salle: string;
  @Prop({ default: '' }) professeur_id: string;
  @Prop({ default: '' }) professeur_nom: string;
  @Prop({ default: '' }) classe_nom: string;
}

export const ReadCreneauSchema = SchemaFactory.createForClass(ReadCreneau);
ReadCreneauSchema.index({ source_id: 1 }, { unique: true });
ReadCreneauSchema.index({ classe_id: 1 });
