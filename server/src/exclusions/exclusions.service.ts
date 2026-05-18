import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { EleveExclu } from './exclusion.schema';
import { Eleve } from '../eleves/eleve.schema';

@Injectable()
export class ExclusionsService {
  constructor(
    @InjectModel(EleveExclu.name) private excluModel: Model<EleveExclu>,
    @InjectModel(Eleve.name) private eleveModel: Model<Eleve>,
  ) {}

  findAll() {
    return this.excluModel.find().sort({ date_exclusion: -1 }).exec();
  }

  findByEleve(eleveId: string) {
    return this.excluModel.findOne({ eleve_id: eleveId }).exec();
  }

  async exclureEleve(eleveId: string, data: { raison: string; commentaire?: string; annee_scolaire: string; nb_avertissements?: number }) {
    const eleve = await this.eleveModel.findById(eleveId).exec();
    if (!eleve) throw new BadRequestException('Élève introuvable');
    if (eleve.statut === 'exclu') throw new BadRequestException('Élève déjà exclu');
    if (eleve.statut === 'parti') throw new BadRequestException('Élève déjà parti');
    if (!data.raison?.trim()) throw new BadRequestException('Une raison est obligatoire');

    const classe_nom = (eleve as any).classe_nom || '';
    const exclu = await new this.excluModel({
      eleve_id: eleveId,
      nom: eleve.nom,
      prenom: eleve.prenom,
      classe_id: eleve.classe_id,
      classe_nom,
      date_exclusion: new Date().toISOString().slice(0, 10),
      raison: data.raison,
      commentaire: data.commentaire || '',
      nb_avertissements_au_moment: data.nb_avertissements || 0,
      annee_scolaire: data.annee_scolaire,
    }).save();

    await this.eleveModel.findByIdAndUpdate(eleveId, { statut: 'exclu' }).exec();
    return exclu;
  }

  async annulerExclusion(eleveId: string) {
    await this.excluModel.deleteOne({ eleve_id: eleveId }).exec();
    await this.eleveModel.findByIdAndUpdate(eleveId, { statut: 'actif' }).exec();
    return { ok: true };
  }
}
