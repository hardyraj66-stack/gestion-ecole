import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

const toJsonTransform = (_: any, ret: Record<string, any>) => {
  ret.id = ret._id;
  delete ret._id;
  delete ret.__v;
  return ret;
};

@Schema({ timestamps: true, toJSON: { virtuals: true, transform: toJsonTransform } })
export class Matiere extends Document {
  @Prop({ required: true })
  nom: string;

  @Prop({ required: true })
  code: string;

  /** Coefficient global (legacy — utilisé si coefficients est vide) */
  @Prop({ default: 1 })
  coefficient: number;

  /** Coefficients par niveau scolaire */
  @Prop({ type: [{ niveau: String, coefficient: Number }], default: [] })
  coefficients: Array<{ niveau: string; coefficient: number }>;

  @Prop()
  description: string;

  @Prop()
  couleur: string;
}

export const MatiereSchema = SchemaFactory.createForClass(Matiere);
