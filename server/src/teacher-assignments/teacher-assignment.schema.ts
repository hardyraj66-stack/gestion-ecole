import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

const toJsonTransform = (_: any, ret: Record<string, any>) => {
  ret.id = ret._id;
  delete ret._id;
  delete ret.__v;
  return ret;
};

@Schema({ timestamps: true, toJSON: { virtuals: true, transform: toJsonTransform } })
export class TeacherAssignment extends Document {
  @Prop({ required: true })
  professeur_id: string;

  @Prop({ required: true })
  classe_id: string;

  @Prop({ required: true })
  matiere_id: string;
}

export const TeacherAssignmentSchema = SchemaFactory.createForClass(TeacherAssignment);
TeacherAssignmentSchema.index({ classe_id: 1, matiere_id: 1 }, { unique: true });
