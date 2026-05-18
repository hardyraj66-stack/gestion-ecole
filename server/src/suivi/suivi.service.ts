import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Avertissement } from './avertissement.schema';
import { Absence } from './absence.schema';
import { Convocation } from './convocation.schema';

const SEUIL_ESCALADE = 3;

@Injectable()
export class SuiviService {
  constructor(
    @InjectModel(Avertissement.name) private avertModel: Model<Avertissement>,
    @InjectModel(Absence.name) private absenceModel: Model<Absence>,
    @InjectModel(Convocation.name) private convocationModel: Model<Convocation>,
  ) {}

  // ===== AVERTISSEMENTS =====
  findAvertissements(eleveId: string) {
    return this.avertModel.find({ eleve_id: eleveId }).sort({ date: -1 }).exec();
  }

  async createAvertissement(data: any) {
    const saved = await new this.avertModel(data).save();
    const count = await this.avertModel.countDocuments({ eleve_id: data.eleve_id }).exec();
    return { avertissement: saved, count, escalade: count >= SEUIL_ESCALADE };
  }

  deleteAvertissement(id: string) { return this.avertModel.findByIdAndDelete(id).exec(); }

  async countAvertissements(eleveId: string) {
    return this.avertModel.countDocuments({ eleve_id: eleveId }).exec();
  }

  // ===== ABSENCES / RETARDS =====
  findAbsences(eleveId: string) {
    return this.absenceModel.find({ eleve_id: eleveId, type: 'absence' }).sort({ date: -1 }).exec();
  }
  findRetards(eleveId: string) {
    return this.absenceModel.find({ eleve_id: eleveId, type: 'retard' }).sort({ date: -1 }).exec();
  }
  createAbsence(data: any) { return new this.absenceModel(data).save(); }
  deleteAbsence(id: string) { return this.absenceModel.findByIdAndDelete(id).exec(); }

  // ===== CONVOCATIONS PARENTS =====
  findConvocations(eleveId: string) {
    return this.convocationModel.find({ eleve_id: eleveId }).sort({ date: -1 }).exec();
  }

  async createConvocation(eleveId: string, data: any) {
    const nb = await this.countAvertissements(eleveId);
    return new this.convocationModel({ ...data, eleve_id: eleveId, nb_avertissements: nb }).save();
  }

  async updateConvocation(id: string, data: any) {
    return this.convocationModel.findByIdAndUpdate(id, data, { new: true }).exec();
  }

  deleteConvocation(id: string) { return this.convocationModel.findByIdAndDelete(id).exec(); }
}
