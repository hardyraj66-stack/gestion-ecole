import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Matiere } from './matiere.schema';
import { Note } from '../notes/note.schema';
import { Creneau } from '../planning/creneau.schema';
import { Niveau } from '../niveaux/niveau.schema';

@Injectable()
export class MatieresService {
  constructor(
    @InjectModel(Matiere.name) private model: Model<Matiere>,
    @InjectModel(Note.name) private noteModel: Model<Note>,
    @InjectModel(Creneau.name) private creneauModel: Model<Creneau>,
    @InjectModel(Niveau.name) private niveauModel: Model<Niveau>,
  ) {}

  findAll() { return this.model.find({ actif: { $ne: false } }).exec(); }
  findById(id: string) { return this.model.findById(id).exec(); }

  async create(data: any) {
    this.validateCoefficients(data.coefficients);
    const payload = { ...data };
    delete payload.coefficient;
    const saved = await new this.model(payload).save();
    await this.syncNiveauxFromCoefficients(saved._id.toString(), [], data.coefficients ?? []);
    return saved;
  }

  async update(id: string, data: any) {
    if (data.coefficients !== undefined) this.validateCoefficients(data.coefficients);
    const payload = { ...data };
    delete payload.coefficient;
    const before = await this.model.findById(id).lean().exec();
    const updated = await this.model.findByIdAndUpdate(id, payload, { new: true }).exec();
    if (data.coefficients !== undefined) {
      const oldCoeffs: any[] = (before as any)?.coefficients ?? [];
      await this.syncNiveauxFromCoefficients(id, oldCoeffs, data.coefficients);
    }
    return updated;
  }

  private async syncNiveauxFromCoefficients(matiereId: string, oldCoeffs: any[], newCoeffs: any[]) {
    const oldNiveaux = new Set(oldCoeffs.map((c: any) => c.niveau));
    const newNiveaux = new Set(newCoeffs.map((c: any) => c.niveau));
    const added = [...newNiveaux].filter(n => !oldNiveaux.has(n));
    const removed = [...oldNiveaux].filter(n => !newNiveaux.has(n));
    if (added.length > 0) {
      await this.niveauModel.updateMany(
        { nom: { $in: added } },
        { $addToSet: { matiere_ids: matiereId } },
      ).exec();
    }
    if (removed.length > 0) {
      await this.niveauModel.updateMany(
        { nom: { $in: removed } },
        { $pull: { matiere_ids: matiereId } as any },
      ).exec();
    }
  }

  async desactiver(id: string) {
    const creneauActif = await this.creneauModel.findOne({ matiere_id: id }).exec();
    if (creneauActif) {
      throw new BadRequestException(
        'Cette matière est utilisée dans le planning. Retirez-la d\'abord de tous les créneaux.',
      );
    }
    const result = await this.model.findByIdAndUpdate(id, { actif: false }, { new: true }).exec();
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
