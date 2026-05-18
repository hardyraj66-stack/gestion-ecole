import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Matiere } from './matiere.schema';
import { Note } from '../notes/note.schema';
import { Creneau } from '../planning/creneau.schema';

@Injectable()
export class MatieresService {
  constructor(
    @InjectModel(Matiere.name) private model: Model<Matiere>,
    @InjectModel(Note.name) private noteModel: Model<Note>,
    @InjectModel(Creneau.name) private creneauModel: Model<Creneau>,
  ) {}

  findAll() { return this.model.find().exec(); }
  findById(id: string) { return this.model.findById(id).exec(); }

  async create(data: any) {
    this.validateCoefficients(data.coefficients);
    const payload = { ...data };
    delete payload.coefficient;
    return new this.model(payload).save();
  }

  async update(id: string, data: any) {
    if (data.coefficients !== undefined) this.validateCoefficients(data.coefficients);
    const payload = { ...data };
    delete payload.coefficient;
    return this.model.findByIdAndUpdate(id, payload, { new: true }).exec();
  }

  async delete(id: string) {
    const [notesCount, creneauxCount] = await Promise.all([
      this.noteModel.countDocuments({ matiere_id: id }).exec(),
      this.creneauModel.countDocuments({ matiere_id: id }).exec(),
    ]);
    if (notesCount > 0 || creneauxCount > 0) {
      throw new BadRequestException(
        `Cette matière ne peut pas être supprimée car elle est utilisée dans ${notesCount} note(s) et ${creneauxCount} créneau(x) de planning.`,
      );
    }
    const result = await this.model.findByIdAndDelete(id).exec();
    return !!result;
  }

  private validateCoefficients(coefficients: any) {
    if (!Array.isArray(coefficients)) return;
    for (const c of coefficients) {
      if (!c.niveau || typeof c.niveau !== 'string' || !c.niveau.trim()) {
        throw new BadRequestException('Chaque coefficient doit avoir un niveau valide.');
      }
      if (typeof c.coefficient !== 'number' || c.coefficient <= 0) {
        throw new BadRequestException(`Le coefficient pour le niveau « ${c.niveau} » doit être un nombre positif.`);
      }
    }
    const niveaux = coefficients.map((c: any) => c.niveau);
    if (new Set(niveaux).size !== niveaux.length) {
      throw new BadRequestException('Chaque niveau ne peut apparaître qu\'une seule fois dans les coefficients.');
    }
  }

  static resolveCoefficient(mat: any, niveau?: string): number {
    const coefficients: Array<{ niveau: string; coefficient: number }> = mat.coefficients || [];
    if (niveau && coefficients.length > 0) {
      const found = coefficients.find(c => c.niveau === niveau);
      if (found) return found.coefficient;
    }
    if (coefficients.length === 1) return coefficients[0].coefficient;
    return mat.coefficient ?? 1;
  }
}
