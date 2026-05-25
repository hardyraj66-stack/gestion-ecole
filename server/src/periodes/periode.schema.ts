import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

const toJsonTransform = (_: any, ret: Record<string, any>) => {
  ret.id = ret._id;
  delete ret._id;
  delete ret.__v;
  return ret;
};

@Schema({ timestamps: true, toJSON: { virtuals: true, transform: toJsonTransform } })
export class PeriodeEvaluation extends Document {
  @Prop({ required: true, enum: [1, 2, 3] })
  trimestre: number;

  @Prop({ required: true, enum: ['ds', 'evaluation'] })
  type: string;

  @Prop({ required: true })
  annee_scolaire: string;

  @Prop({ default: null })
  date_debut: string | null;

  @Prop({ default: null })
  date_fin: string | null;

  @Prop({ default: false })
  terminee: boolean;
}

export const PeriodeEvaluationSchema = SchemaFactory.createForClass(PeriodeEvaluation);

// 1 seule période par (trimestre, type, annee_scolaire)
PeriodeEvaluationSchema.index({ trimestre: 1, type: 1, annee_scolaire: 1 }, { unique: true });
