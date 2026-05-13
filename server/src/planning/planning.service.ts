import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Creneau } from './creneau.schema';

@Injectable()
export class PlanningService {
  constructor(@InjectModel(Creneau.name) private model: Model<Creneau>) {}

  findAll() { return this.model.find().exec(); }
  findById(id: string) { return this.model.findById(id).exec(); }
  findByClasseId(classeId: string) { return this.model.find({ classe_id: classeId }).exec(); }
  create(data: any) { return new this.model(data).save(); }

  async update(id: string, data: any) {
    return this.model.findByIdAndUpdate(id, data, { new: true }).exec();
  }

  async delete(id: string) {
    const result = await this.model.findByIdAndDelete(id).exec();
    return !!result;
  }
}
