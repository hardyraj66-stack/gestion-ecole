import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

const t = (_: any, ret: Record<string, any>) => { ret.id = ret._id; delete ret._id; delete ret.__v; return ret; };

@Schema({ collection: 'read_dashboard', timestamps: true, toJSON: { virtuals: true, transform: t } })
export class ReadDashboard extends Document {
  @Prop({ default: 'singleton' })
  key: string;

  @Prop({ type: Object })
  stats: { classes: number; eleves: number; matieres: number; notes: number };

  @Prop({ type: [Object] })
  classesWithCount: any[];

  @Prop({ type: [Object] })
  recentEleves: any[];

  @Prop({ type: Object, default: null })
  anneeActive: any;
}

export const ReadDashboardSchema = SchemaFactory.createForClass(ReadDashboard);
