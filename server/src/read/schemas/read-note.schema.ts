import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

const t = (_: any, ret: Record<string, any>) => {
  ret.id = ret.source_id;
  delete ret._id; delete ret.__v; delete ret.source_id;
  return ret;
};

@Schema({ collection: 'read_notes', timestamps: true, toJSON: { virtuals: true, transform: t } })
export class ReadNote extends Document {
  @Prop({ required: true }) source_id: string;
  @Prop() eleve_id: string;
  @Prop() matiere_id: string;
  @Prop() valeur: number;
  @Prop() trimestre: number;
  @Prop({ default: null }) type: string | null;
  @Prop() date: string;
  @Prop() commentaire: string;
  @Prop({ default: '' }) eleve_nom: string;
  @Prop({ default: '' }) eleve_prenom: string;
  @Prop({ default: '' }) matiere_nom: string;
  @Prop({ default: '' }) matiere_code: string;
  @Prop({ default: '' }) annee_scolaire: string;
}

export const ReadNoteSchema = SchemaFactory.createForClass(ReadNote);
ReadNoteSchema.index({ source_id: 1 }, { unique: true });
ReadNoteSchema.index({ eleve_id: 1, trimestre: 1 });
ReadNoteSchema.index({ matiere_id: 1, trimestre: 1 });
ReadNoteSchema.index({ annee_scolaire: 1 });
