import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

const toJsonTransform = (_: any, ret: Record<string, any>) => {
  ret.id = ret._id;
  delete ret._id;
  delete ret.__v;
  return ret;
};

@Schema({ timestamps: true, toJSON: { virtuals: true, transform: toJsonTransform } })
export class Eleve extends Document {
  @Prop({ required: true })
  nom: string;

  @Prop({ required: true })
  prenom: string;

  @Prop({ required: true })
  date_naissance: string;

  @Prop({ required: true, enum: ['M', 'F'] })
  genre: string;

  @Prop({ required: true })
  classe_id: string;

  @Prop()
  email: string;

  @Prop()
  telephone: string;

  @Prop()
  adresse: string;

  // Famille
  @Prop({ type: { nom: String, prenom: String, telephone: String, email: String, statut: { type: String, enum: ['vivant', 'decede'], default: 'vivant' } }, default: null })
  pere: { nom: string; prenom: string; telephone: string; email: string; statut: 'vivant' | 'decede' } | null;

  @Prop({ type: { nom: String, prenom: String, telephone: String, email: String, statut: { type: String, enum: ['vivant', 'decede'], default: 'vivant' } }, default: null })
  mere: { nom: string; prenom: string; telephone: string; email: string; statut: 'vivant' | 'decede' } | null;

  @Prop({ type: { nom: String, prenom: String, telephone: String, email: String, lien: String }, default: null })
  tuteur: { nom: string; prenom: string; telephone: string; email: string; lien: string } | null;

  // Statut de l'élève dans l'établissement
  @Prop({ required: true, enum: ['actif', 'exclu', 'parti'], default: 'actif' })
  statut: 'actif' | 'exclu' | 'parti';

  // Inscription officielle dans une année scolaire
  @Prop({ default: null })
  inscrit_annee_id: string | null;

  @Prop({
    enum: ['inscrit', 'non_inscrit', 'en_attente', null],
    default: null,
  })
  statut_inscription: 'inscrit' | 'non_inscrit' | 'en_attente' | null;

  // Historique des classes par année scolaire — alimenté lors de chaque demarrer()
  @Prop({
    type: [{
      annee_scolaire: String,
      anneeScolaireId: String,
      classe_id: String,
      classe_nom: String,
      niveau: String,
      statut: String,
    }],
    default: [],
  })
  historique_classes: Array<{
    annee_scolaire: string;
    /** Référence ID vers la collection AnneeScolaire */
    anneeScolaireId?: string;
    classe_id: string;
    classe_nom: string;
    niveau: string;
    statut: string;
  }>;
}

export const EleveSchema = SchemaFactory.createForClass(Eleve);
EleveSchema.index({ classe_id: 1 });
EleveSchema.index({ 'historique_classes.annee_scolaire': 1 });
EleveSchema.index({ 'historique_classes.anneeScolaireId': 1 });
EleveSchema.index({ inscrit_annee_id: 1 });
EleveSchema.index({ inscrit_annee_id: 1, statut_inscription: 1 });
