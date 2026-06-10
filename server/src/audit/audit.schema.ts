import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

const toJsonTransform = (_: any, ret: Record<string, any>) => {
  ret.id = ret._id;
  delete ret._id;
  delete ret.__v;
  return ret;
};

@Schema({ timestamps: true, toJSON: { virtuals: true, transform: toJsonTransform } })
export class AuditLog extends Document {
  /** Ex. 'user.create', 'user.update', 'user.delete', 'user.restore', 'user.reset_password'. */
  @Prop({ required: true })
  action: string;

  /** Compte concerné par l'action. */
  @Prop({ default: '' })
  targetUserId: string;

  /** Compte ayant effectué l'action. */
  @Prop({ default: '' })
  byUserId: string;

  /** Détails additionnels (rôle, champs modifiés…). */
  @Prop({ type: Object, default: {} })
  meta: Record<string, any>;
}

export const AuditLogSchema = SchemaFactory.createForClass(AuditLog);
AuditLogSchema.index({ createdAt: -1 });
