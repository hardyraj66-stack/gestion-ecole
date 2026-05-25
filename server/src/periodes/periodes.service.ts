import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PeriodeEvaluation } from './periode.schema';

@Injectable()
export class PeriodesService {
  constructor(
    @InjectModel(PeriodeEvaluation.name) private periodeModel: Model<PeriodeEvaluation>,
  ) {}

  private computeStatut(p: PeriodeEvaluation): string {
    if ((p as any).terminee) return 'terminee';
    if (!p.date_debut || !p.date_fin) return 'non-planifiee';
    const today = new Date().toISOString().slice(0, 10);
    if (today >= p.date_debut && today <= p.date_fin) return 'active';
    if (today < p.date_debut) return 'future';
    return 'terminee';
  }

  async findAll(annee_scolaire: string) {
    const periodes = await this.periodeModel.find({ annee_scolaire }).sort({ trimestre: 1, type: 1 }).exec();
    return periodes.map(p => ({ ...(p.toJSON() as any), statut: this.computeStatut(p) }));
  }

  findById(id: string) {
    return this.periodeModel.findById(id).exec();
  }

  /**
   * Retourne la période actuellement active (date_debut <= today <= date_fin).
   * Null si aucune période n'est active.
   */
  async getActivePeriode(): Promise<PeriodeEvaluation | null> {
    const today = new Date().toISOString().slice(0, 10);
    return this.periodeModel.findOne({
      terminee: { $ne: true },
      date_debut: { $lte: today },
      date_fin: { $gte: today },
    }).exec();
  }

  /**
   * Initialise les 6 périodes d'une année scolaire si elles n'existent pas encore.
   */
  async initForAnnee(annee_scolaire: string, startDate?: string) {
    const existing = await this.periodeModel.countDocuments({ annee_scolaire }).exec();
    if (existing >= 6) return;
    const today = startDate ?? new Date().toISOString().slice(0, 10);
    const periodes = [
      { trimestre: 1, type: 'ds',         date_debut: today, date_fin: null },
      { trimestre: 1, type: 'evaluation', date_debut: null,  date_fin: null },
      { trimestre: 2, type: 'ds',         date_debut: null,  date_fin: null },
      { trimestre: 2, type: 'evaluation', date_debut: null,  date_fin: null },
      { trimestre: 3, type: 'ds',         date_debut: null,  date_fin: null },
      { trimestre: 3, type: 'evaluation', date_debut: null,  date_fin: null },
    ];
    for (const p of periodes) {
      await this.periodeModel.updateOne(
        { trimestre: p.trimestre, type: p.type, annee_scolaire },
        { $setOnInsert: { trimestre: p.trimestre, type: p.type, annee_scolaire, date_debut: p.date_debut, date_fin: p.date_fin } },
        { upsert: true },
      ).exec();
    }
  }

  async update(id: string, data: { date_debut?: string | null; date_fin?: string | null }) {
    const periode = await this.periodeModel.findById(id).exec();
    if (!periode) return null;

    const date_debut = data.date_debut ?? periode.date_debut;
    const date_fin = data.date_fin ?? periode.date_fin;

    // Contrainte : période Évaluation ne peut pas débuter avant la fin du DS du même trimestre
    if (periode.type === 'evaluation' && date_debut) {
      const ds = await this.periodeModel.findOne({
        trimestre: periode.trimestre,
        type: 'ds',
        annee_scolaire: periode.annee_scolaire,
      }).exec();
      if (ds?.date_fin && !ds.terminee && date_debut <= ds.date_fin) {
        throw new BadRequestException(
          `La période Évaluation T${periode.trimestre} doit débuter après la fin du DS (${ds.date_fin}).`,
        );
      }
    }

    // Contrainte : date_debut < date_fin
    if (date_debut && date_fin && date_debut > date_fin) {
      throw new BadRequestException('La date de début doit être antérieure à la date de fin.');
    }

    const updated = await this.periodeModel.findByIdAndUpdate(
      id,
      { $set: { date_debut: date_debut ?? null, date_fin: date_fin ?? null } },
      { new: true },
    ).exec();
    if (!updated) return null;
    return { ...(updated.toJSON() as any), statut: this.computeStatut(updated) };
  }

  async terminer(id: string) {
    const today = new Date().toISOString().slice(0, 10);
    const updated = await this.periodeModel.findByIdAndUpdate(
      id,
      { $set: { date_fin: today, terminee: true } },
      { new: true },
    ).exec();
    if (!updated) return null;
    return { ...(updated.toJSON() as any), statut: 'terminee' };
  }
}
