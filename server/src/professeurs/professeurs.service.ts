import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Professeur } from './professeur.schema';
import { TeacherAssignment } from '../teacher-assignments/teacher-assignment.schema';

@Injectable()
export class ProfesseursService {
  constructor(
    @InjectModel(Professeur.name) private model: Model<Professeur>,
    @InjectModel(TeacherAssignment.name) private assignmentModel: Model<TeacherAssignment>,
  ) {}

  findAll() { return this.model.find().exec(); }
  findById(id: string) { return this.model.findById(id).exec(); }
  findActifs() { return this.model.find({ statut: 'actif' }).exec(); }

  create(data: any) { return new this.model(data).save(); }

  update(id: string, data: any) {
    return this.model.findByIdAndUpdate(id, data, { new: true }).exec();
  }

  async desactiver(id: string) {
    const prof = await this.model.findByIdAndUpdate(
      id,
      { statut: 'inactif' },
      { new: true },
    ).exec();
    if (!prof) return false;
    await this.assignmentModel.deleteMany({ professeur_id: id }).exec();
    return true;
  }
}
