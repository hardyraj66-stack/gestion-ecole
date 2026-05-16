import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

const t = (_: any, ret: Record<string, any>) => { ret.id = ret._id; delete ret._id; delete ret.__v; return ret; };

@Schema({ collection: 'read_eleves_list', timestamps: true, toJSON: { virtuals: true, transform: t } })
export class ReadElevesList extends Document {
  @Prop({ default: 'singleton' })
  key: string;

  @Prop({ type: [Object] })
  eleves: any[];

  @Prop({ type: [Object] })
  classes: any[];
}

export const ReadElevesListSchema = SchemaFactory.createForClass(ReadElevesList);
