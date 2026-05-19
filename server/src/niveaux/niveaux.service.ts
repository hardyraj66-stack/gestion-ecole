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

  /**
   * Si l'ordre demandé est déjà pris par un autre niveau, décale vers le haut
   * (+1) tous les niveaux dont l'ordre >= ordreVoulu (sauf le niveau en cours d'édition).
   */
  private async shiftOrdreIfNeeded(ordreVoulu: number, excludeId?: string) {
    const conflict = await this.model.findOne({
      ordre: ordreVoulu,
      ...(excludeId ? { _id: { $ne: excludeId } } : {}),
    }).exec();

    if (!conflict) return; // pas de conflit, rien à faire

    // Décaler tous les niveaux >= ordreVoulu (sauf celui qu'on est en train de modifier)
    await this.model.updateMany(
      {
        ordre: { $gte: ordreVoulu },
        ...(excludeId ? { _id: { $ne: excludeId } } : {}),
      },
      { $inc: { ordre: 1 } },
    ).exec();
  }

  async create(data: { nom: string; ordre?: number; description?: string; matiere_ids?: string[] }) {
    const existing = await this.model.findOne({ nom: { $regex: `^${data.nom.trim()}$`, $options: 'i' } }).exec();
    if (existing) throw new BadRequestException(`Un niveau nommé « ${data.nom.trim()} » existe déjà`);

    const ordre = data.ordre ?? 0;
    await this.shiftOrdreIfNeeded(ordre);

    return new this.model({
      nom: data.nom.trim(),
      ordre,
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

    if (data.ordre !== undefined && data.ordre !== existing.ordre) {
      await this.shiftOrdreIfNeeded(data.ordre, id);
    }

    return this.model.findByIdAndUpdate(id, data, { new: true }).exec();
  }

  async delete(id: string) {
    const deleted = await this.model.findByIdAndDelete(id).exec();
    if (!deleted) return false;

    // Compacter les ordres après suppression pour éviter les trous
    const all = await this.model.find().sort({ ordre: 1, nom: 1 }).exec();
    for (let i = 0; i < all.length; i++) {
      if (all[i].ordre !== i) {
        await this.model.findByIdAndUpdate(all[i]._id, { ordre: i }).exec();
      }
    }
    return true;
  }

  /** Vérifie qu'une matière est autorisée pour un niveau donné (par nom de niveau) */
  async isMatiereAutorisee(niveauNom: string, matiereId: string): Promise<boolean> {
    const niveau = await this.model.findOne({ nom: niveauNom }).exec();
    if (!niveau) return true;
    if (!niveau.matiere_ids || niveau.matiere_ids.length === 0) return true;
    return niveau.matiere_ids.includes(matiereId);
  }
}
