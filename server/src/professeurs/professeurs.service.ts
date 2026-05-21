import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Professeur } from './professeur.schema';

@Injectable()
export class ProfesseursService {
  constructor(@InjectModel(Professeur.name) private model: Model<Professeur>) {}

  findAll() { return this.model.find().exec(); }
  findById(id: string) { return this.model.findById(id).exec(); }
  findActifs() { return this.model.find({ statut: 'actif' }).exec(); }

  create(data: any) { return new this.model(data).save(); }

  update(id: string, data: any) {
    return this.model.findByIdAndUpdate(id, data, { new: true }).exec();
  }

  async delete(id: string) {
    const result = await this.model.findByIdAndDelete(id).exec();
    return !!result;
  }
}
