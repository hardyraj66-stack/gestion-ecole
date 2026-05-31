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

  // Dates planifiées (modifiables selon statut)
  @Prop({ default: null }) debut_planifie: string | null;
  @Prop({ default: null }) fin_planifie: string | null;

  // Dates réelles (renseignées par demarrer() et terminer())
  @Prop({ default: null }) debut_reel: string | null;
  @Prop({ default: null }) fin_reel: string | null;

  // Garde-fou irréversibilité de la migration
  @Prop({ default: false }) migration_effectuee: boolean;

  @Prop({ required: true, enum: ['active', 'terminee', 'preparation'], default: 'preparation' })
  statut: AnneeStatut;

  @Prop({ type: [{ action: String, date: String, details: String }], default: [] })
  historique: { action: string; date: string; details: string }[];
}

export const AnneeScolaireSchema = SchemaFactory.createForClass(AnneeScolaire);
AnneeScolaireSchema.index({ statut: 1 });
AnneeScolaireSchema.index({ debut_planifie: 1 });
AnneeScolaireSchema.index({ fin_planifie: 1 });

// Virtuels de rétrocompatibilité : debut = debut_planifie, fin = fin_planifie
AnneeScolaireSchema.virtual('debut').get(function () {
  return (this as any).debut_planifie;
});
AnneeScolaireSchema.virtual('fin').get(function () {
  return (this as any).fin_planifie;
});
