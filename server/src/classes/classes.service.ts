import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Classe } from './classe.schema';

@Injectable()
export class ClassesService {
  constructor(@InjectModel(Classe.name) private model: Model<Classe>) {}

  findAll() { return this.model.find().exec(); }
  findById(id: string) { return this.model.findById(id).exec(); }
  create(data: any) { return new this.model(data).save(); }

  async update(id: string, data: any) {
    return this.model.findByIdAndUpdate(id, data, { new: true }).exec();
  }

  async delete(id: string) {
    const result = await this.model.findByIdAndDelete(id).exec();
    return !!result;
  }
}
