import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

// Transform: id = source_id (l'id write original), pas _id du read
const t = (_: any, ret: Record<string, any>) => {
  ret.id = ret.source_id;
  delete ret._id; delete ret.__v; delete ret.source_id;
  return ret;
};

@Schema({ collection: 'read_classes', timestamps: true, toJSON: { virtuals: true, transform: t } })
export class ReadClasse extends Document {
  @Prop({ required: true }) source_id: string;
  @Prop() nom: string;
  @Prop() niveau: string;
  @Prop() annee_scolaire: string;
  @Prop() capacite: number;
  @Prop() salle: string;
  @Prop() salle_type: string;
  @Prop({ default: 0 }) nb_eleves: number;
  @Prop({ default: 0 }) taux: number;
}

export const ReadClasseSchema = SchemaFactory.createForClass(ReadClasse);
ReadClasseSchema.index({ source_id: 1 }, { unique: true });
