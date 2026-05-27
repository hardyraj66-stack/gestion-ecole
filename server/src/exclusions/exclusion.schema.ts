import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

const t = (_: any, ret: Record<string, any>) => {
  ret.id = ret._id; delete ret._id; delete ret.__v; return ret;
};

// Collection dédiée aux élèves exclus (renvoi disciplinaire)
@Schema({ timestamps: true, toJSON: { virtuals: true, transform: t } })
export class EleveExclu extends Document {
  @Prop({ required: true }) eleve_id: string;
  @Prop({ required: true }) nom: string;
  @Prop({ required: true }) prenom: string;
  @Prop({ required: true }) classe_id: string;
  @Prop({ required: true }) classe_nom: string;
  @Prop({ required: true }) date_exclusion: string;
  @Prop({ required: true }) raison: string;
  @Prop({ default: '' }) commentaire: string;
  @Prop({ default: 0 }) nb_avertissements_au_moment: number;
  /** @deprecated Utiliser anneeScolaireId — conservé pour doublon temporaire */
  @Prop({ required: false, default: '' }) annee_scolaire: string;
  /** Référence ID vers la collection AnneeScolaire */
  @Prop({ required: false, default: '' }) anneeScolaireId: string;
}

export const EleveExcluSchema = SchemaFactory.createForClass(EleveExclu);
EleveExcluSchema.index({ eleve_id: 1 });
EleveExcluSchema.index({ eleve_id: 1, annee_scolaire: 1 });
EleveExcluSchema.index({ eleve_id: 1, anneeScolaireId: 1 });
