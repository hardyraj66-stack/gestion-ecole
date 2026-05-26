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

  private async getAnneeActiveLabel(): Promise<string> {
    const annee = await this.anneeModel.findOne({ statut: 'active' }).exec();
    return annee?.label || '';
  }

  // ===== AVERTISSEMENTS =====
  findAvertissements(eleveId: string, annee_scolaire?: string) {
    const filter: any = { eleve_id: eleveId };
    if (annee_scolaire) filter.annee_scolaire = annee_scolaire;
    return this.avertModel.find(filter).sort({ date: -1 }).exec();
  }

  async createAvertissement(data: any) {
    const annee_scolaire = data.annee_scolaire || await this.getAnneeActiveLabel();
    const saved = await new this.avertModel({ ...data, annee_scolaire }).save();
    const count = await this.avertModel.countDocuments({ eleve_id: data.eleve_id, annee_scolaire }).exec();
    return { avertissement: saved, count, escalade: count >= SEUIL_ESCALADE };
  }

  deleteAvertissement(id: string) { return this.avertModel.findByIdAndDelete(id).exec(); }

  async countAvertissements(eleveId: string, annee_scolaire?: string) {
    const filter: any = { eleve_id: eleveId };
    if (annee_scolaire) filter.annee_scolaire = annee_scolaire;
    return this.avertModel.countDocuments(filter).exec();
  }

  // ===== ABSENCES / RETARDS =====
  findAbsences(eleveId: string, annee_scolaire?: string) {
    const filter: any = { eleve_id: eleveId, type: 'absence' };
    if (annee_scolaire) filter.annee_scolaire = annee_scolaire;
    return this.absenceModel.find(filter).sort({ date: -1 }).exec();
  }
  findRetards(eleveId: string, annee_scolaire?: string) {
    const filter: any = { eleve_id: eleveId, type: 'retard' };
    if (annee_scolaire) filter.annee_scolaire = annee_scolaire;
    return this.absenceModel.find(filter).sort({ date: -1 }).exec();
  }
  async createAbsence(data: any) {
    const annee_scolaire = data.annee_scolaire || await this.getAnneeActiveLabel();
    return new this.absenceModel({ ...data, annee_scolaire }).save();
  }
  deleteAbsence(id: string) { return this.absenceModel.findByIdAndDelete(id).exec(); }

  // ===== CONVOCATIONS PARENTS =====
  findConvocations(eleveId: string, annee_scolaire?: string) {
    const filter: any = { eleve_id: eleveId };
    if (annee_scolaire) filter.annee_scolaire = annee_scolaire;
    return this.convocationModel.find(filter).sort({ date: -1 }).exec();
  }

  async createConvocation(eleveId: string, data: any) {
    const annee_scolaire = data.annee_scolaire || await this.getAnneeActiveLabel();
    const nb = await this.countAvertissements(eleveId, annee_scolaire);
    return new this.convocationModel({ ...data, eleve_id: eleveId, nb_avertissements: nb, annee_scolaire }).save();
  }

  async updateConvocation(id: string, data: any) {
    return this.convocationModel.findByIdAndUpdate(id, data, { new: true }).exec();
  }

  deleteConvocation(id: string) { return this.convocationModel.findByIdAndDelete(id).exec(); }
}
