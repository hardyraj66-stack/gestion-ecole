import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

const t = (_: any, ret: Record<string, any>) => { ret.id = ret._id; delete ret._id; delete ret.__v; return ret; };

@Schema({ collection: 'read_classes_list', timestamps: true, toJSON: { virtuals: true, transform: t } })
export class ReadClassesList extends Document {
  @Prop({ default: 'singleton' })
  key: string;

  @Prop({ type: [Object] })
  items: any[];
}

export const ReadClassesListSchema = SchemaFactory.createForClass(ReadClassesList);
