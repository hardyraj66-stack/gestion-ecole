import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { ROLES } from '../auth/auth.constants';

const toJsonTransform = (_: any, ret: Record<string, any>) => {
  ret.id = ret._id;
  delete ret._id;
  delete ret.__v;
  delete ret.passwordHash; // ne jamais exposer le hash du mot de passe
  delete ret.resetTokenHash; // ni le jeton de réinitialisation
  delete ret.resetTokenExpires;
  return ret;
};

@Schema({ timestamps: true, toJSON: { virtuals: true, transform: toJsonTransform } })
export class User extends Document {
  @Prop({ required: true, unique: true, trim: true, lowercase: true })
  username: string;

  @Prop({ required: true })
  passwordHash: string;

  @Prop({ default: '' })
  nom: string;

  /** Email de contact (sert à l'envoi des identifiants à la création). */
  @Prop({ default: '' })
  email: string;

  @Prop({ required: true, enum: ROLES, default: 'secretaire' })
  role: string;

  @Prop({ default: true })
  actif: boolean;

  /** Lien vers la fiche Professeur (rempli si role='professeur'). */
  @Prop({ default: null })
  professeur_id: string | null;

  /** Force le changement de mot de passe à la prochaine connexion. */
  @Prop({ default: false })
  mustChangePassword: boolean;

  /** Soft-delete : compte archivé (jamais réellement effacé). */
  @Prop({ default: false })
  deleted: boolean;

  /** Version de jeton : incrémentée pour invalider les sessions existantes. */
  @Prop({ default: 0 })
  tokenVersion: number;

  /** Dernière connexion réussie. */
  @Prop({ default: null })
  lastLoginAt: Date | null;

  /** Hash SHA-256 du jeton « mot de passe oublié » (jamais exposé). */
  @Prop({ default: '' })
  resetTokenHash: string;

  /** Expiration (timestamp ms) du jeton de réinitialisation. */
  @Prop({ default: 0 })
  resetTokenExpires: number;
}

export const UserSchema = SchemaFactory.createForClass(User);
UserSchema.index({ username: 1 }, { unique: true });
