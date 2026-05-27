import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Avertissement } from './avertissement.schema';
import { Absence } from './absence.schema';
import { Convocation } from './convocation.schema';
import { AnneeScolaire } from '../annees/annee.schema';

const SEUIL_ESCALADE = 3;

@Injectable()
export class SuiviService {
  constructor(
    @InjectModel(Avertissement.name) private avertModel: Model<Avertissement>,
    @InjectModel(Absence.name) private absenceModel: Model<Absence>,
    @InjectModel(Convocation.name) private convocationModel: Model<Convocation>,
    @InjectModel(AnneeScolaire.name) private anneeModel: Model<AnneeScolaire>,
  ) {}

  /** Retourne l'ID de l'année scolaire active */
  private async getAnneeActiveId(): Promise<string> {
    const annee = await this.anneeModel.findOne({ statut: 'active' }).exec();
    return annee ? (annee as any)._id.toString() : '';
  }

  // ===== AVERTISSEMENTS =====
  findAvertissements(eleveId: string, anneeId?: string) {
    const filter: any = { eleve_id: eleveId };
    if (anneeId) filter.anneeScolaireId = anneeId;
    return this.avertModel.find(filter).sort({ date: -1 }).exec();
  }

  async createAvertissement(data: any) {
    const anneeScolaireId = data.anneeScolaireId || await this.getAnneeActiveId();
    const saved = await new this.avertModel({ ...data, anneeScolaireId }).save();
    const count = await this.avertModel.countDocuments({ eleve_id: data.eleve_id, anneeScolaireId }).exec();
    return { avertissement: saved, count, escalade: count >= SEUIL_ESCALADE };
  }

  deleteAvertissement(id: string) { return this.avertModel.findByIdAndDelete(id).exec(); }

  async countAvertissements(eleveId: string, anneeId?: string) {
    const filter: any = { eleve_id: eleveId };
    if (anneeId) filter.anneeScolaireId = anneeId;
    return this.avertModel.countDocuments(filter).exec();
  }

  // ===== ABSENCES / RETARDS =====
  findAbsences(eleveId: string, anneeId?: string) {
    const filter: any = { eleve_id: eleveId, type: 'absence' };
    if (anneeId) filter.anneeScolaireId = anneeId;
    return this.absenceModel.find(filter).sort({ date: -1 }).exec();
  }
  findRetards(eleveId: string, anneeId?: string) {
    const filter: any = { eleve_id: eleveId, type: 'retard' };
    if (anneeId) filter.anneeScolaireId = anneeId;
    return this.absenceModel.find(filter).sort({ date: -1 }).exec();
  }
  async createAbsence(data: any) {
    const anneeScolaireId = data.anneeScolaireId || await this.getAnneeActiveId();
    return new this.absenceModel({ ...data, anneeScolaireId }).save();
  }
  deleteAbsence(id: string) { return this.absenceModel.findByIdAndDelete(id).exec(); }

  // ===== CONVOCATIONS PARENTS =====
  findConvocations(eleveId: string, anneeId?: string) {
    const filter: any = { eleve_id: eleveId };
    if (anneeId) filter.anneeScolaireId = anneeId;
    return this.convocationModel.find(filter).sort({ date: -1 }).exec();
  }

  async createConvocation(eleveId: string, data: any) {
    const anneeScolaireId = data.anneeScolaireId || await this.getAnneeActiveId();
    const nb = await this.countAvertissements(eleveId, anneeScolaireId);
    return new this.convocationModel({ ...data, eleve_id: eleveId, nb_avertissements: nb, anneeScolaireId }).save();
  }

  async updateConvocation(id: string, data: any) {
    return this.convocationModel.findByIdAndUpdate(id, data, { new: true }).exec();
  }

  deleteConvocation(id: string) { return this.convocationModel.findByIdAndDelete(id).exec(); }
}
