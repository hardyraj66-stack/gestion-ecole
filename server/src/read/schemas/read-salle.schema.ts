import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

const t = (_: any, ret: Record<string, any>) => {
  ret.id = ret.source_id;
  delete ret._id; delete ret.__v; delete ret.source_id;
  return ret;
};

@Schema({ collection: 'read_salles', timestamps: true, toJSON: { virtuals: true, transform: t } })
export class ReadSalle extends Document {
  @Prop({ required: true }) source_id: string;
  @Prop() nom: string;
  @Prop() capacite: number;
  @Prop() description: string;
  @Prop() type: string;
  @Prop({ type: [String], default: [] }) equipements: string[];
  @Prop({ default: false }) accessible_pmr: boolean;
  @Prop({ default: '' }) batiment: string;
  @Prop({ default: '' }) etage: string;
  @Prop({ default: '' }) anneeScolaireId: string;
}

export const ReadSalleSchema = SchemaFactory.createForClass(ReadSalle);
ReadSalleSchema.index({ source_id: 1 }, { unique: true });
ReadSalleSchema.index({ anneeScolaireId: 1 });
