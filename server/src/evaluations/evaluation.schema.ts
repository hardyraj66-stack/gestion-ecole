import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

const toJsonTransform = (_: any, ret: Record<string, any>) => {
  ret.id = ret._id;
  delete ret._id;
  delete ret.__v;
  return ret;
};

export class NoteEvaluation {
  eleve_id: string;
  valeur: number | null;
  absent: boolean;
}

@Schema({ timestamps: true, toJSON: { virtuals: true, transform: toJsonTransform } })
export class Evaluation extends Document {
  @Prop({ required: true, enum: ['ds', 'evaluation'] })
  type: string;

  @Prop({ required: true })
  classe_id: string;

  @Prop({ required: true })
  matiere_id: string;

  @Prop({ required: true, enum: [1, 2, 3] })
  trimestre: number;

  /** @deprecated Utiliser anneeScolaireId — conservé pour doublon temporaire */
  @Prop({ required: false, default: '' })
  annee_scolaire: string;

  /** Référence ID vers la collection AnneeScolaire */
  @Prop({ required: false, default: '' })
  anneeScolaireId: string;

  @Prop({ required: true })
  date: string;

  @Prop({ required: true, enum: ['brouillon', 'publie'], default: 'brouillon' })
  statut: string;

  @Prop({
    type: [{ eleve_id: String, valeur: { type: Number, default: null }, absent: { type: Boolean, default: false } }],
    default: [],
  })
  notes: NoteEvaluation[];
}

export const EvaluationSchema = SchemaFactory.createForClass(Evaluation);

// Index compound unique : 1 DS et 1 Évaluation max par triplet (classe, matière, trimestre)
EvaluationSchema.index({ classe_id: 1, matiere_id: 1, trimestre: 1, type: 1 }, { unique: true });
