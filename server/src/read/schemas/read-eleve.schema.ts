import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

const t = (_: any, ret: Record<string, any>) => {
  ret.id = ret.source_id;
  delete ret._id; delete ret.__v; delete ret.source_id;
  return ret;
};

@Schema({ collection: 'read_eleves', timestamps: true, toJSON: { virtuals: true, transform: t } })
export class ReadEleve extends Document {
  @Prop({ required: true }) source_id: string;
  @Prop({ required: true, default: '' }) annee_scolaire: string;
  @Prop() nom: string;
  @Prop() prenom: string;
  @Prop() date_naissance: string;
  @Prop() genre: string;
  @Prop() classe_id: string;
  @Prop() email: string;
  @Prop() telephone: string;
  @Prop() adresse: string;
  @Prop({ default: '' }) classe_nom: string;
  @Prop({ default: '' }) classe_niveau: string;
  @Prop({ type: Object, default: null }) pere: any;
  @Prop({ type: Object, default: null }) mere: any;
  @Prop({ type: Object, default: null }) tuteur: any;
  @Prop({ default: 'actif' }) statut: string;
}

export const ReadEleveSchema = SchemaFactory.createForClass(ReadEleve);
// Un document par (élève × année scolaire)
ReadEleveSchema.index({ source_id: 1, annee_scolaire: 1 }, { unique: true });
ReadEleveSchema.index({ annee_scolaire: 1 });
ReadEleveSchema.index({ classe_id: 1, annee_scolaire: 1 });
