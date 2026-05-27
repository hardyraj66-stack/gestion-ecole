import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

const toJsonTransform = (_: any, ret: Record<string, any>) => {
  ret.id = ret._id;
  delete ret._id;
  delete ret.__v;
  return ret;
};

@Schema({ timestamps: true, toJSON: { virtuals: true, transform: toJsonTransform } })
export class Note extends Document {
  @Prop({ required: true })
  eleve_id: string;

  @Prop({ required: true })
  matiere_id: string;

  @Prop({ required: true })
  valeur: number;

  @Prop({ required: true, enum: [1, 2, 3], default: 1 })
  trimestre: number;

  @Prop({ enum: ['ds', 'evaluation'], default: null })
  type: string | null;

  @Prop({ required: true })
  date: string;

  @Prop()
  commentaire: string;

  @Prop({ default: false })
  annulee: boolean;

  /** @deprecated Utiliser anneeScolaireId — conservé pour doublon temporaire et affichage */
  @Prop({ default: '' })
  annee_scolaire: string;

  /** Référence ID vers la collection AnneeScolaire */
  @Prop({ default: '' })
  anneeScolaireId: string;
}

export const NoteSchema = SchemaFactory.createForClass(Note);
NoteSchema.index({ eleve_id: 1, trimestre: 1, annulee: 1 });
NoteSchema.index({ matiere_id: 1 });
NoteSchema.index({ annee_scolaire: 1 });
NoteSchema.index({ anneeScolaireId: 1 });
