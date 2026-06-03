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

  // Conservé pendant la transition — suppression à l'étape 20
  @Prop()
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

  // Conservé pendant la transition — suppression à l'étape 20
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
    anneeScolaireId?: string;
    classe_id: string;
    classe_nom: string;
    niveau: string;
    statut: string;
  }>;

  // Nouveau système d'inscriptions
  @Prop({
    type: [{
      classeId: { type: String, required: true },
      status: { type: String, enum: ['active', 'inactive'], required: true },
      anneeScolaireId: { type: String, required: true },
      ordre: { type: Number, required: true, min: 1 },
    }],
    default: [],
  })
  inscriptions: Array<{
    classeId: string;
    status: 'active' | 'inactive';
    anneeScolaireId: string;
    ordre: number;
  }>;
}

export const EleveSchema = SchemaFactory.createForClass(Eleve);
EleveSchema.index({ inscrit_annee_id: 1 });
EleveSchema.index({ inscrit_annee_id: 1, statut_inscription: 1 });
EleveSchema.index({ 'inscriptions.classeId': 1, 'inscriptions.status': 1 });
EleveSchema.index({ 'inscriptions.anneeScolaireId': 1 });
EleveSchema.index({ 'inscriptions.anneeScolaireId': 1, 'inscriptions.status': 1 });
