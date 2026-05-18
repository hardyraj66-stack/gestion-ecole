import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

const t = (_: any, ret: Record<string, any>) => {
  ret.id = ret._id; delete ret._id; delete ret.__v; return ret;
};

@Schema({ timestamps: true, toJSON: { virtuals: true, transform: t } })
export class Absence extends Document {
  @Prop({ required: true }) eleve_id: string;
  @Prop({ required: true }) date: string;
  @Prop({ default: '' }) motif: string;
  @Prop({ required: true, enum: ['absence', 'retard'], default: 'absence' }) type: string;
  @Prop({ default: '' }) duree: string; // pour les retards : "15 min", "1h"
  @Prop({ default: false }) justifiee: boolean;
}

export const AbsenceSchema = SchemaFactory.createForClass(Absence);
AbsenceSchema.index({ eleve_id: 1, type: 1 });
