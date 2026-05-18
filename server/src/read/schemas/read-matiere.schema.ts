import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

const t = (_: any, ret: Record<string, any>) => {
  ret.id = ret.source_id;
  delete ret._id; delete ret.__v; delete ret.source_id;
  return ret;
};

@Schema({ collection: 'read_matieres', timestamps: true, toJSON: { virtuals: true, transform: t } })
export class ReadMatiere extends Document {
  @Prop({ required: true }) source_id: string;
  @Prop() nom: string;
  @Prop() code: string;
  @Prop() coefficient: number;
  @Prop({ type: [{ niveau: String, coefficient: Number }], default: [] })
  coefficients: Array<{ niveau: string; coefficient: number }>;
  @Prop() description: string;
  @Prop() couleur: string;
}

export const ReadMatiereSchema = SchemaFactory.createForClass(ReadMatiere);
ReadMatiereSchema.index({ source_id: 1 }, { unique: true });
