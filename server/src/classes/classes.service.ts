import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Classe } from './classe.schema';

@Injectable()
export class ClassesService {
  constructor(@InjectModel(Classe.name) private model: Model<Classe>) {}

  findAll() { return this.model.find().exec(); }
  findById(id: string) { return this.model.findById(id).exec(); }

  async create(data: any) {
    if (data.salle_type === 'fixe' && data.salle) {
      const conflict = await this.model.findOne({ salle: data.salle, salle_type: 'fixe' }).exec();
      if (conflict) throw new BadRequestException(`La salle « ${data.salle} » est déjà assignée à la classe « ${conflict.nom} ».`);
    }
    return new this.model(data).save();
  }

  async update(id: string, data: any) {
    if (data.salle_type === 'fixe' && data.salle) {
      const conflict = await this.model.findOne({ salle: data.salle, salle_type: 'fixe', _id: { $ne: id } }).exec();
      if (conflict) throw new BadRequestException(`La salle « ${data.salle} » est déjà assignée à la classe « ${conflict.nom} ».`);
    }
    return this.model.findByIdAndUpdate(id, data, { new: true }).exec();
  }

  async delete(id: string) {
    const result = await this.model.findByIdAndDelete(id).exec();
    return !!result;
  }
}
