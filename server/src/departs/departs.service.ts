import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { EleveQuitte } from './depart.schema';
import { Eleve } from '../eleves/eleve.schema';

@Injectable()
export class DepartsService {
  constructor(
    @InjectModel(EleveQuitte.name) private quitteModel: Model<EleveQuitte>,
    @InjectModel(Eleve.name) private eleveModel: Model<Eleve>,
  ) {}

  findAll() {
    return this.quitteModel.find().sort({ date_depart: -1 }).exec();
  }

  findByEleve(eleveId: string) {
    return this.quitteModel.findOne({ eleve_id: eleveId }).exec();
  }

  async enregistrerDepart(eleveId: string, data: { raison: string; motif: string; commentaire?: string; annee_scolaire: string }) {
    const eleve = await this.eleveModel.findById(eleveId).exec();
    if (!eleve) throw new BadRequestException('Élève introuvable');
    if (eleve.statut === 'parti') throw new BadRequestException('Élève déjà marqué comme parti');
    if (eleve.statut === 'exclu') throw new BadRequestException('Cet élève est exclu — utilisez la gestion des exclusions');
    if (!data.raison?.trim()) throw new BadRequestException('Une raison est obligatoire');
    if (!data.motif) throw new BadRequestException('Un motif est obligatoire');

    const classe_nom = (eleve as any).classe_nom || '';
    const quitte = await new this.quitteModel({
      eleve_id: eleveId,
      nom: eleve.nom,
      prenom: eleve.prenom,
      classe_id: eleve.classe_id,
      classe_nom,
      date_depart: new Date().toISOString().slice(0, 10),
      raison: data.raison,
      motif: data.motif,
      commentaire: data.commentaire || '',
      annee_scolaire: data.annee_scolaire,
    }).save();

    await this.eleveModel.findByIdAndUpdate(eleveId, { statut: 'parti' }).exec();
    return quitte;
  }

  async annulerDepart(eleveId: string) {
    await this.quitteModel.deleteOne({ eleve_id: eleveId }).exec();
    await this.eleveModel.findByIdAndUpdate(eleveId, { statut: 'actif' }).exec();
    return { ok: true };
  }
}
