import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Eleve } from './eleve.schema';

@Injectable()
export class ElevesService {
  constructor(@InjectModel(Eleve.name) private model: Model<Eleve>) {}

  findAll() { return this.model.find().exec(); }
  findById(id: string) { return this.model.findById(id).exec(); }

  countByClasse(classeId: string) {
    return this.model.countDocuments({
      inscriptions: { $elemMatch: { classeId, status: 'active' } },
    }).exec();
  }

  findByClasseId(classeId: string) {
    return this.model.find({
      inscriptions: { $elemMatch: { classeId, status: 'active' } },
    }).exec();
  }

  async create(data: any) {
    const { classeId, anneeScolaireId, ...rest } = data;
    const payload: any = { ...rest };
    if (classeId) {
      payload.inscriptions = [{ classeId, status: 'active', anneeScolaireId: anneeScolaireId || '', ordre: 1 }];
      // Rétrocompat: conserver classe_id pendant la transition
      payload.classe_id = classeId;
    }
    return new this.model(payload).save();
  }

  async update(id: string, data: any) {
    const { classeId, ...rest } = data;
    if (classeId) {
      // Mettre à jour l'entrée active existante (pas de nouvelle entrée)
      await this.model.updateOne(
        { _id: id, 'inscriptions.status': 'active' },
        { $set: { 'inscriptions.$[elem].classeId': classeId, classe_id: classeId } },
        { arrayFilters: [{ 'elem.status': 'active' }] },
      ).exec();
      return this.model.findByIdAndUpdate(id, rest, { new: true }).exec();
    }
    return this.model.findByIdAndUpdate(id, data, { new: true }).exec();
  }

  async setStatut(id: string, statut: 'actif' | 'exclu' | 'parti') {
    const result = await this.model.findByIdAndUpdate(id, { statut }, { new: true }).exec();
    return !!result;
  }

  async inscrire(eleveId: string, anneeId: string) {
    return this.model.findByIdAndUpdate(
      eleveId,
      { inscrit_annee_id: anneeId, statut_inscription: 'inscrit' },
      { new: true },
    ).exec();
  }

  async desinscrire(eleveId: string) {
    return this.model.findByIdAndUpdate(
      eleveId,
      { inscrit_annee_id: null, statut_inscription: 'non_inscrit' },
      { new: true },
    ).exec();
  }

  async reinscire(id: string, classeId: string, anneeScolaireId: string) {
    const eleve = await this.model.findById(id).exec();
    if (!eleve) throw new NotFoundException('Élève introuvable');

    const inscriptions: any[] = (eleve as any).inscriptions || [];

    // Vérifier si une entrée active existe déjà pour cet anneeScolaireId
    const existingActive = inscriptions.find(
      i => i.status === 'active' && i.anneeScolaireId === anneeScolaireId
    );

    if (existingActive) {
      // Juste mettre à jour le classeId de l'entrée active
      await this.model.updateOne(
        { _id: id, 'inscriptions.status': 'active', 'inscriptions.anneeScolaireId': anneeScolaireId },
        { $set: { 'inscriptions.$[elem].classeId': classeId, classe_id: classeId } },
        { arrayFilters: [{ 'elem.status': 'active', 'elem.anneeScolaireId': anneeScolaireId }] },
      ).exec();
    } else {
      // Passer l'entrée active actuelle en inactive
      await this.model.updateOne(
        { _id: id, 'inscriptions.status': 'active' },
        { $set: { 'inscriptions.$[elem].status': 'inactive' } },
        { arrayFilters: [{ 'elem.status': 'active' }] },
      ).exec();

      // Calculer le prochain ordre
      const maxOrdre = inscriptions.reduce((m, i) => Math.max(m, i.ordre || 0), 0);

      // Pousser la nouvelle entrée active
      await this.model.updateOne(
        { _id: id },
        {
          $push: { inscriptions: { classeId, status: 'active', anneeScolaireId, ordre: maxOrdre + 1 } },
          $set: { classe_id: classeId },
        },
      ).exec();
    }

    return this.model.findById(id).exec();
  }

  private getInscriptionActive(eleve: any) {
    return (eleve.inscriptions || []).find((i: any) => i.status === 'active') ?? null;
  }
}
