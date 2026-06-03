import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Niveau } from './niveau.schema';
import { Classe } from '../classes/classe.schema';
import { Matiere } from '../matieres/matiere.schema';
import { AnneeScolaire } from '../annees/annee.schema';

@Injectable()
export class NiveauxService {
  constructor(
    @InjectModel(Niveau.name) private model: Model<Niveau>,
    @InjectModel(Classe.name) private classeModel: Model<Classe>,
    @InjectModel(Matiere.name) private matiereModel: Model<Matiere>,
    @InjectModel(AnneeScolaire.name) private anneeModel: Model<AnneeScolaire>,
  ) {}

  /** Résout l'année cible pour les écritures : active sinon préparation. */
  private async resolveAnneeCible(): Promise<string> {
    let annee = await this.anneeModel.findOne({ statut: 'active' }).exec();
    if (!annee) annee = await this.anneeModel.findOne({ statut: 'preparation' }).exec();
    if (!annee) throw new BadRequestException('Aucune année scolaire active ou en préparation');
    return (annee as any)._id.toString();
  }

  findAll() {
    return this.model.find().sort({ ordre: 1, nom: 1 }).exec();
  }

  findById(id: string) {
    return this.model.findById(id).exec();
  }

  async findByNom(nom: string, anneeScolaireId?: string) {
    const filter: any = { nom };
    if (anneeScolaireId) filter.anneeScolaireId = anneeScolaireId;
    return this.model.findOne(filter).exec();
  }

  /** Réassigne des ordres consécutifs (0, 1, 2…) au sein d'une même année. */
  private async recompact(anneeScolaireId: string, targetId?: string, targetOrdre?: number) {
    const all = await this.model.find({ anneeScolaireId }).sort({ ordre: 1, nom: 1 }).exec();

    type Item = { _id: any; ordre: number };
    let items: Item[] = all.map(n => ({ _id: n._id, ordre: n.ordre }));

    if (targetId !== undefined && targetOrdre !== undefined) {
      items = items.filter(n => String(n._id) !== targetId);
      const clampedOrdre = Math.max(0, Math.min(targetOrdre, items.length));
      items.splice(clampedOrdre, 0, { _id: targetId, ordre: targetOrdre });
    }

    const ops = items
      .map((item, i) => item.ordre !== i
        ? { updateOne: { filter: { _id: item._id }, update: { $set: { ordre: i } } } }
        : null)
      .filter(Boolean);

    if (ops.length > 0) await this.model.bulkWrite(ops as any);
  }

  async create(data: { nom: string; ordre?: number; description?: string; matiere_ids?: string[] }) {
    const anneeScolaireId = await this.resolveAnneeCible();
    const existing = await this.model.findOne({
      nom: { $regex: `^${data.nom.trim()}$`, $options: 'i' },
      anneeScolaireId,
    }).exec();
    if (existing) throw new BadRequestException(`Un niveau nommé « ${data.nom.trim()} » existe déjà`);

    const total = await this.model.countDocuments({ anneeScolaireId }).exec();
    const ordre = Math.max(0, Math.min(data.ordre ?? total, total));

    const saved = await new this.model({
      nom: data.nom.trim(),
      ordre,
      description: data.description ?? '',
      matiere_ids: data.matiere_ids ?? [],
      anneeScolaireId,
    }).save();

    await this.recompact(anneeScolaireId, String(saved._id), ordre);
    const niveauNom = data.nom.trim();
    await this.syncMatieresFromIds(niveauNom, [], data.matiere_ids ?? [], anneeScolaireId);
    return this.model.findById(saved._id).exec();
  }

  async update(id: string, data: Partial<{ nom: string; ordre: number; description: string; matiere_ids: string[] }>) {
    const existing = await this.model.findById(id).exec();
    if (!existing) throw new NotFoundException('Niveau introuvable');

    const anneeScolaireId = (existing as any).anneeScolaireId ?? '';

    if (data.nom) {
      const duplicate = await this.model.findOne({
        nom: { $regex: `^${data.nom.trim()}$`, $options: 'i' },
        anneeScolaireId,
        _id: { $ne: id },
      }).exec();
      if (duplicate) throw new BadRequestException(`Un niveau nommé « ${data.nom.trim()} » existe déjà`);
    }

    const updated = await this.model.findByIdAndUpdate(id, data, { new: true }).exec();

    if (data.matiere_ids !== undefined) {
      const niveauNom = data.nom?.trim() ?? existing.nom;
      const oldIds: string[] = (existing as any).matiere_ids ?? [];
      await this.syncMatieresFromIds(niveauNom, oldIds, data.matiere_ids, anneeScolaireId);
    }

    if (data.ordre !== undefined) {
      await this.recompact(anneeScolaireId, id, data.ordre);
      return this.model.findById(id).exec();
    }

    return updated;
  }

  private async syncMatieresFromIds(niveauNom: string, oldIds: string[], newIds: string[], anneeScolaireId: string) {
    const oldSet = new Set(oldIds);
    const newSet = new Set(newIds);
    const added = [...newSet].filter(id => !oldSet.has(id));
    const removed = [...oldSet].filter(id => !newSet.has(id));
    if (added.length > 0) {
      await this.matiereModel.updateMany(
        { _id: { $in: added }, anneeScolaireId, 'coefficients.niveau': { $ne: niveauNom } },
        { $push: { coefficients: { niveau: niveauNom, coefficient: 1 } } as any },
      ).exec();
    }
    if (removed.length > 0) {
      await this.matiereModel.updateMany(
        { _id: { $in: removed }, anneeScolaireId },
        { $pull: { coefficients: { niveau: niveauNom } } as any },
      ).exec();
    }
  }

  async delete(id: string) {
    const niveau = await this.model.findById(id).exec();
    if (!niveau) return false;

    const anneeScolaireId = (niveau as any).anneeScolaireId ?? '';

    const classeUtilisante = await this.classeModel.findOne({
      niveau: niveau.nom,
      anneeScolaireId,
      actif: { $ne: false },
    }).exec();
    if (classeUtilisante) {
      throw new BadRequestException(
        `Impossible de supprimer le niveau « ${niveau.nom} » : des classes actives l'utilisent.`,
      );
    }

    const deleted = await this.model.findByIdAndDelete(id).exec();
    if (!deleted) return false;
    await this.recompact(anneeScolaireId);
    return true;
  }

  /** Compacte publiquement les ordres de toutes les années. */
  async recompactPublic() {
    const anneeIds = await this.model.distinct('anneeScolaireId').exec();
    for (const aid of anneeIds as string[]) {
      await this.recompact(aid);
    }
    return this.model.find().sort({ ordre: 1, nom: 1 }).exec();
  }

  /** Vérifie qu'une matière est autorisée pour un niveau donné (par nom de niveau, scopé année) */
  async isMatiereAutorisee(niveauNom: string, matiereId: string, anneeScolaireId?: string): Promise<boolean> {
    const filter: any = { nom: niveauNom };
    if (anneeScolaireId) filter.anneeScolaireId = anneeScolaireId;
    const niveau = await this.model.findOne(filter).exec();
    if (!niveau) return true;
    if (!niveau.matiere_ids || niveau.matiere_ids.length === 0) return true;
    return niveau.matiere_ids.includes(matiereId);
  }
}
