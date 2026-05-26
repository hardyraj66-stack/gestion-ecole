import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

const t = (_: any, ret: Record<string, any>) => {
  ret.id = ret._id; delete ret._id; delete ret.__v; return ret;
};

@Schema({ timestamps: true, toJSON: { virtuals: true, transform: t } })
export class Convocation extends Document {
  @Prop({ required: true }) eleve_id: string;
  @Prop({ required: true }) date: string;
  @Prop({ required: true }) raison: string;
  @Prop({ default: '' }) commentaire: string;
  @Prop({ default: false }) effectuee: boolean;
  // avertissements liés au moment de la convocation (snapshot du count)
  @Prop({ default: 0 }) nb_avertissements: number;
  @Prop({ default: '' }) annee_scolaire: string;
}

export const ConvocationSchema = SchemaFactory.createForClass(Convocation);
ConvocationSchema.index({ eleve_id: 1 });
ConvocationSchema.index({ eleve_id: 1, annee_scolaire: 1 });
