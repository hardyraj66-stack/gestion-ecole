import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Niveau } from './niveau.schema';

@Injectable()
export class NiveauxService {
  constructor(@InjectModel(Niveau.name) private model: Model<Niveau>) {}

  findAll() {
    return this.model.find().sort({ ordre: 1, nom: 1 }).exec();
  }

  findById(id: string) {
    return this.model.findById(id).exec();
  }

  async findByNom(nom: string) {
    return this.model.findOne({ nom }).exec();
  }

  async create(data: { nom: string; ordre?: number; description?: string; matiere_ids?: string[] }) {
    const existing = await this.model.findOne({ nom: { $regex: `^${data.nom.trim()}$`, $options: 'i' } }).exec();
    if (existing) throw new BadRequestException(`Un niveau nommé « ${data.nom.trim()} » existe déjà`);
    return new this.model({
      nom: data.nom.trim(),
      ordre: data.ordre ?? 0,
      description: data.description ?? '',
      matiere_ids: data.matiere_ids ?? [],
    }).save();
  }

  async update(id: string, data: Partial<{ nom: string; ordre: number; description: string; matiere_ids: string[] }>) {
    const existing = await this.model.findById(id).exec();
    if (!existing) throw new NotFoundException('Niveau introuvable');
    if (data.nom) {
      const duplicate = await this.model.findOne({
        nom: { $regex: `^${data.nom.trim()}$`, $options: 'i' },
        _id: { $ne: id },
      }).exec();
      if (duplicate) throw new BadRequestException(`Un niveau nommé « ${data.nom.trim()} » existe déjà`);
    }
    return this.model.findByIdAndUpdate(id, data, { new: true }).exec();
  }

  async delete(id: string) {
    const result = await this.model.findByIdAndDelete(id).exec();
    return !!result;
  }

  /** Vérifie qu'une matière est autorisée pour un niveau donné (par nom de niveau) */
  async isMatiereAutorisee(niveauNom: string, matiereId: string): Promise<boolean> {
    const niveau = await this.model.findOne({ nom: niveauNom }).exec();
    if (!niveau) return true; // Si pas de config niveau, on laisse passer
    if (!niveau.matiere_ids || niveau.matiere_ids.length === 0) return true; // Liste vide = tout autorisé
    return niveau.matiere_ids.includes(matiereId);
  }
}
