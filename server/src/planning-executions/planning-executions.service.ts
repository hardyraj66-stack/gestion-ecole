import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PlanningExecution } from './planning-execution.schema';

@Injectable()
export class PlanningExecutionsService {
  constructor(@InjectModel(PlanningExecution.name) private model: Model<PlanningExecution>) {}

  findByClasse(classeId: string, dateDebut?: string, dateFin?: string) {
    const filter: any = { classe_id: classeId };
    if (dateDebut || dateFin) {
      filter.date = {};
      if (dateDebut) filter.date.$gte = dateDebut;
      if (dateFin) filter.date.$lte = dateFin;
    }
    return this.model.find(filter).sort({ date: 1 }).exec();
  }

  findByProfesseur(professeurId: string, dateDebut?: string, dateFin?: string) {
    const filter: any = { professeur_id: professeurId };
    if (dateDebut || dateFin) {
      filter.date = {};
      if (dateDebut) filter.date.$gte = dateDebut;
      if (dateFin) filter.date.$lte = dateFin;
    }
    return this.model.find(filter).sort({ date: 1 }).exec();
  }

  findByDate(date: string) { return this.model.find({ date }).exec(); }

  create(data: any) { return new this.model(data).save(); }

  update(id: string, data: any) {
    return this.model.findByIdAndUpdate(id, data, { new: true }).exec();
  }

  async delete(id: string) {
    const result = await this.model.findByIdAndDelete(id).exec();
    return !!result;
  }

  async purgeBeforeDate(date: string) {
    const result = await this.model.deleteMany({ date: { $lt: date } }).exec();
    return { deleted: result.deletedCount };
  }
}
