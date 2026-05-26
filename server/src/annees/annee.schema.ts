import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type AnneeStatut = 'active' | 'terminee' | 'preparation';

const toJsonTransform = (_: any, ret: Record<string, any>) => {
  ret.id = ret._id;
  delete ret._id;
  delete ret.__v;
  return ret;
};

@Schema({ timestamps: true, toJSON: { virtuals: true, transform: toJsonTransform } })
export class AnneeScolaire extends Document {
  @Prop({ required: true, unique: true })
  label: string;

  @Prop({ required: true })
  debut: string;

  @Prop({ required: true })
  fin: string;

  @Prop({ required: true, enum: ['active', 'terminee', 'preparation'], default: 'preparation' })
  statut: AnneeStatut;

  @Prop({ type: [{ action: String, date: String, details: String }], default: [] })
  historique: { action: string; date: string; details: string }[];
}

export const AnneeScolaireSchema = SchemaFactory.createForClass(AnneeScolaire);
AnneeScolaireSchema.index({ statut: 1 });
