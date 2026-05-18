import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Avertissement } from './avertissement.schema';
import { Absence } from './absence.schema';

@Injectable()
export class SuiviService {
  constructor(
    @InjectModel(Avertissement.name) private avertModel: Model<Avertissement>,
    @InjectModel(Absence.name) private absenceModel: Model<Absence>,
  ) {}

  // ===== AVERTISSEMENTS =====
  findAvertissements(eleveId: string) {
    return this.avertModel.find({ eleve_id: eleveId }).sort({ date: -1 }).exec();
  }
  createAvertissement(data: any) { return new this.avertModel(data).save(); }
  deleteAvertissement(id: string) { return this.avertModel.findByIdAndDelete(id).exec(); }

  // ===== ABSENCES / RETARDS =====
  findAbsences(eleveId: string) {
    return this.absenceModel.find({ eleve_id: eleveId, type: 'absence' }).sort({ date: -1 }).exec();
  }
  findRetards(eleveId: string) {
    return this.absenceModel.find({ eleve_id: eleveId, type: 'retard' }).sort({ date: -1 }).exec();
  }
  createAbsence(data: any) { return new this.absenceModel(data).save(); }
  deleteAbsence(id: string) { return this.absenceModel.findByIdAndDelete(id).exec(); }
}
