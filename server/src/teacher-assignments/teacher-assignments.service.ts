import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { TeacherAssignment } from './teacher-assignment.schema';
import { Professeur } from '../professeurs/professeur.schema';

@Injectable()
export class TeacherAssignmentsService {
  constructor(
    @InjectModel(TeacherAssignment.name) private model: Model<TeacherAssignment>,
    @InjectModel(Professeur.name) private professeurModel: Model<Professeur>,
  ) {}

  findAll() { return this.model.find().exec(); }
  findByClasse(classeId: string) { return this.model.find({ classe_id: classeId }).exec(); }
  findByClasseAndMatiere(classeId: string, matiereId: string) {
    return this.model.findOne({ classe_id: classeId, matiere_id: matiereId }).exec();
  }

  async resolve(classeId: string, matiereId: string) {
    const assignment = await this.model.findOne({ classe_id: classeId, matiere_id: matiereId }).lean().exec();
    if (!assignment) return null;
    const prof = await this.professeurModel.findById(assignment.professeur_id).lean().exec();
    return prof ? { professeur: prof } : null;
  }

  async create(data: any) {
    const existing = await this.model.findOne({ classe_id: data.classe_id, matiere_id: data.matiere_id }).exec();
    if (existing) {
      return this.model.findByIdAndUpdate(existing._id, { professeur_id: data.professeur_id }, { new: true }).exec();
    }
    return new this.model(data).save();
  }

  update(id: string, data: any) {
    return this.model.findByIdAndUpdate(id, data, { new: true }).exec();
  }

  async delete(id: string) {
    const result = await this.model.findByIdAndDelete(id).exec();
    return !!result;
  }
}
