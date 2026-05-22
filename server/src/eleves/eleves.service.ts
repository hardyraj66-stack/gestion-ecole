import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Eleve } from './eleve.schema';

@Injectable()
export class ElevesService {
  constructor(@InjectModel(Eleve.name) private model: Model<Eleve>) {}

  findAll() { return this.model.find().exec(); }
  findById(id: string) { return this.model.findById(id).exec(); }
  findByClasseId(classeId: string) { return this.model.find({ classe_id: classeId }).exec(); }
  create(data: any) { return new this.model(data).save(); }

  async update(id: string, data: any) {
    return this.model.findByIdAndUpdate(id, data, { new: true }).exec();
  }

  async setStatut(id: string, statut: 'actif' | 'exclu' | 'parti') {
    const result = await this.model.findByIdAndUpdate(id, { statut }, { new: true }).exec();
    return !!result;
  }
}
