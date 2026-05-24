import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Classe } from './classe.schema';
import { Eleve } from '../eleves/eleve.schema';

@Injectable()
export class ClassesService {
  constructor(
    @InjectModel(Classe.name) private model: Model<Classe>,
    @InjectModel(Eleve.name) private eleveModel: Model<Eleve>,
  ) {}

  findAll() { return this.model.find({ actif: { $ne: false } }).exec(); }
  findById(id: string) { return this.model.findById(id).exec(); }

  async create(data: any) {
    if (data.salle_type === 'fixe' && data.salle) {
      const conflict = await this.model.findOne({ salle: data.salle, salle_type: 'fixe', actif: { $ne: false } }).exec();
      if (conflict) throw new BadRequestException(`La salle « ${data.salle} » est déjà assignée à la classe « ${conflict.nom} ».`);
    }
    return new this.model(data).save();
  }

  async update(id: string, data: any) {
    if (data.salle_type === 'fixe' && data.salle) {
      const conflict = await this.model.findOne({ salle: data.salle, salle_type: 'fixe', actif: { $ne: false }, _id: { $ne: id } }).exec();
      if (conflict) throw new BadRequestException(`La salle « ${data.salle} » est déjà assignée à la classe « ${conflict.nom} ».`);
    }
    return this.model.findByIdAndUpdate(id, data, { new: true }).exec();
  }

  async desactiver(id: string) {
    const eleveActif = await this.eleveModel.findOne({ classe_id: id, statut: 'actif' }).exec();
    if (eleveActif) {
      throw new BadRequestException(
        'Impossible de désactiver une classe avec des élèves actifs. Changez d\'abord le statut de ces élèves.',
      );
    }
    const result = await this.model.findByIdAndUpdate(id, { actif: false }, { new: true }).exec();
    return !!result;
  }
}
