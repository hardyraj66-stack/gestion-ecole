import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Niveau } from './niveau.schema';
import { Classe } from '../classes/classe.schema';
import { Matiere } from '../matieres/matiere.schema';

@Injectable()
export class NiveauxService {
  constructor(
    @InjectModel(Niveau.name) private model: Model<Niveau>,
    @InjectModel(Classe.name) private classeModel: Model<Classe>,
    @InjectModel(Matiere.name) private matiereModel: Model<Matiere>,
  ) {}

  findAll() {
    return this.model.find().sort({ ordre: 1, nom: 1 }).exec();
  }

  findById(id: string) {
    return this.model.findById(id).exec();
  }

  async findByNom(nom: string) {
    return this.model.findOne({ nom }).exec();
  }

  /** Réassigne des ordres consécutifs (0, 1, 2…) en respectant l'ordre voulu pour excludeId. */
  private async recompact(targetId?: string, targetOrdre?: number) {
    const all = await this.model.find().sort({ ordre: 1, nom: 1 }).exec();

    // Construire la liste ordonnée : on place targetId à targetOrdre, les autres autour
    type Item = { _id: any; ordre: number };
    let items: Item[] = all.map(n => ({ _id: n._id, ordre: n.ordre }));

    if (targetId !== undefined && targetOrdre !== undefined) {
      // Retirer l'élément cible de la liste, insérer à la bonne position
      items = items.filter(n => String(n._id) !== targetId);
      const clampedOrdre = Math.max(0, Math.min(targetOrdre, items.length));
      items.splice(clampedOrdre, 0, { _id: targetId, ordre: targetOrdre });
    }

    for (let i = 0; i < items.length; i++) {
      if (items[i].ordre !== i) {
        await this.model.findByIdAndUpdate(items[i]._id, { ordre: i }).exec();
      }
    }
  }

  async create(data: { nom: string; ordre?: number; description?: string; matiere_ids?: string[] }) {
    const existing = await this.model.findOne({ nom: { $regex: `^${data.nom.trim()}$`, $options: 'i' } }).exec();
    if (existing) throw new BadRequestException(`Un niveau nommé « ${data.nom.trim()} » existe déjà`);

    const total = await this.model.countDocuments().exec();
    const ordre = Math.max(0, Math.min(data.ordre ?? total, total));

    const saved = await new this.model({
      nom: data.nom.trim(),
      ordre,
      description: data.description ?? '',
      matiere_ids: data.matiere_ids ?? [],
    }).save();

    await this.recompact(String(saved._id), ordre);
    const niveauNom = data.nom.trim();
    await this.syncMatieresFromIds(niveauNom, [], data.matiere_ids ?? []);
    return this.model.findById(saved._id).exec();
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

    const updated = await this.model.findByIdAndUpdate(id, data, { new: true }).exec();

    if (data.matiere_ids !== undefined) {
      const niveauNom = data.nom?.trim() ?? existing.nom;
      const oldIds: string[] = (existing as any).matiere_ids ?? [];
      await this.syncMatieresFromIds(niveauNom, oldIds, data.matiere_ids);
    }

    if (data.ordre !== undefined) {
      await this.recompact(id, data.ordre);
      return this.model.findById(id).exec();
    }

    return updated;
  }

  private async syncMatieresFromIds(niveauNom: string, oldIds: string[], newIds: string[]) {
    const oldSet = new Set(oldIds);
    const newSet = new Set(newIds);
    const added = [...newSet].filter(id => !oldSet.has(id));
    const removed = [...oldSet].filter(id => !newSet.has(id));
    if (added.length > 0) {
      await this.matiereModel.updateMany(
        { _id: { $in: added }, 'coefficients.niveau': { $ne: niveauNom } },
        { $push: { coefficients: { niveau: niveauNom, coefficient: 1 } } as any },
      ).exec();
    }
    if (removed.length > 0) {
      await this.matiereModel.updateMany(
        { _id: { $in: removed } },
        { $pull: { coefficients: { niveau: niveauNom } } as any },
      ).exec();
    }
  }

  async delete(id: string) {
    const niveau = await this.model.findById(id).exec();
    if (!niveau) return false;

    const classeUtilisante = await this.classeModel.findOne({
      niveau: niveau.nom,
      actif: { $ne: false },
    }).exec();
    if (classeUtilisante) {
      throw new BadRequestException(
        `Impossible de supprimer le niveau « ${niveau.nom} » : des classes actives l'utilisent.`,
      );
    }

    const deleted = await this.model.findByIdAndDelete(id).exec();
    if (!deleted) return false;
    await this.recompact();
    return true;
  }

  /** Compacte publiquement les ordres (utile pour corriger des données existantes). */
  async recompactPublic() {
    await this.recompact();
    return this.model.find().sort({ ordre: 1, nom: 1 }).exec();
  }

  /** Vérifie qu'une matière est autorisée pour un niveau donné (par nom de niveau) */
  async isMatiereAutorisee(niveauNom: string, matiereId: string): Promise<boolean> {
    const niveau = await this.model.findOne({ nom: niveauNom }).exec();
    if (!niveau) return true;
    if (!niveau.matiere_ids || niveau.matiere_ids.length === 0) return true;
    return niveau.matiere_ids.includes(matiereId);
  }
}
