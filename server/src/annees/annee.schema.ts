import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type AnneeStatut = 'active' | 'terminee' | 'preparation';

@Schema({
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: (_, ret) => { ret._id = ret._id; delete ret._id; delete ret.__v; return ret; },
  },
})
export class AnneeScolaire extends Document {
  @Prop({ required: true, unique: true })
  label: string; // ex: "2024-2025"

  @Prop({ required: true })
  debut: string; // "2024-09-02"

  @Prop({ required: true })
  fin: string; // "2025-07-05"

  @Prop({ required: true, enum: ['active', 'terminee', 'preparation'], default: 'preparation' })
  statut: AnneeStatut;

  @Prop({ type: [{ action: String, date: String, details: String }], default: [] })
  historique: { action: string; date: string; details: string }[];
}

export const AnneeScolaireSchema = SchemaFactory.createForClass(AnneeScolaire);
