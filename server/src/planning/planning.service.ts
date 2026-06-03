import { Injectable, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Creneau } from './creneau.schema';
import { Classe } from '../classes/classe.schema';
import { NiveauxService } from '../niveaux/niveaux.service';

const JOURS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
function toMin(t: string) { const [h, m] = t.split(':').map(Number); return h * 60 + m; }

@Injectable()
export class PlanningService {
  constructor(
    @InjectModel(Creneau.name) private model: Model<Creneau>,
    @InjectModel(Classe.name) private classeModel: Model<Classe>,
    private niveauxService: NiveauxService,
  ) {}

  findAll() { return this.model.find().exec(); }
  findById(id: string) { return this.model.findById(id).exec(); }
  findByClasseId(classeId: string) { return this.model.find({ classe_id: classeId }).exec(); }

  private async checkSalleConflict(salle: string, jour: string, heureDebut: string, heureFin: string, excludeId?: string) {
    if (!salle) return;
    const hd = toMin(heureDebut);
    const hf = toMin(heureFin);
    const candidates = await this.model.find({ salle, jour }).lean().exec();
    const conflict = candidates.find(c => {
      if (excludeId && String(c._id) === excludeId) return false;
      return toMin(c.heure_debut) < hf && toMin(c.heure_fin) > hd;
    });
    if (conflict) {
      throw new ConflictException(
        `La salle « ${salle} » est déjà occupée le ${jour} de ${conflict.heure_debut} à ${conflict.heure_fin} (${conflict.matiere_nom})`,
      );
    }
  }

  private async checkMatiereAutorisee(classeId: string, matiereId: string) {
    if (!classeId || !matiereId) return;
    const classe = await this.classeModel.findById(classeId).lean().exec() as any;
    if (!classe) return;
    const autorisee = await this.niveauxService.isMatiereAutorisee(classe.niveau, matiereId, classe.anneeScolaireId);
    if (!autorisee) {
      throw new BadRequestException(
        `Cette matière n'est pas autorisée pour le niveau ${classe.niveau}`,
      );
    }
  }

  async create(data: any) {
    await this.checkMatiereAutorisee(data.classe_id, data.matiere_id);
    await this.checkSalleConflict(data.salle, data.jour, data.heure_debut, data.heure_fin);
    return new this.model(data).save();
  }

  async update(id: string, data: any) {
    const existing = await this.model.findById(id).lean().exec() as any;
    const classeId = data.classe_id ?? existing?.classe_id;
    const matiereId = data.matiere_id ?? existing?.matiere_id;
    await this.checkMatiereAutorisee(classeId, matiereId);

    const salle = data.salle ?? existing?.salle;
    const jour = data.jour ?? existing?.jour;
    const hd = data.heure_debut ?? existing?.heure_debut;
    const hf = data.heure_fin ?? existing?.heure_fin;
    if (salle && jour && hd && hf) {
      await this.checkSalleConflict(salle, jour, hd, hf, id);
    }
    return this.model.findByIdAndUpdate(id, data, { new: true }).exec();
  }

  async delete(id: string) {
    const result = await this.model.findByIdAndDelete(id).exec();
    return !!result;
  }

  // Fusionne tous les créneaux adjacents de même matière/salle/enseignant/jour pour une classe.
  // Retourne le nombre de fusions effectuées.
  async mergeAdjacent(classeId: string): Promise<number> {
    const creneaux = await this.model.find({ classe_id: classeId }).lean().exec();
    const sorted = [...creneaux].sort((a, b) => {
      const jd = JOURS.indexOf(a.jour) - JOURS.indexOf(b.jour);
      return jd !== 0 ? jd : toMin(a.heure_debut) - toMin(b.heure_debut);
    });

    let mergeCount = 0;
    const deleted = new Set<string>();
    const updateOps: any[] = [];
    const deleteIds: string[] = [];

    for (let i = 0; i < sorted.length - 1; i++) {
      const a = sorted[i] as any;
      if (deleted.has(String(a._id))) continue;
      const b = sorted[i + 1] as any;
      if (deleted.has(String(b._id))) continue;
      if (a.jour === b.jour && a.matiere_id === b.matiere_id && a.salle === b.salle
          && (a.professeur_id || '') === (b.professeur_id || '') && a.heure_fin === b.heure_debut) {
        updateOps.push({ updateOne: { filter: { _id: a._id }, update: { $set: { heure_fin: b.heure_fin } } } });
        deleteIds.push(String(b._id));
        deleted.add(String(b._id));
        sorted[i] = { ...a, heure_fin: b.heure_fin };
        mergeCount++;
      }
    }

    if (updateOps.length > 0) await this.model.bulkWrite(updateOps);
    if (deleteIds.length > 0) await this.model.deleteMany({ _id: { $in: deleteIds } }).exec();

    return mergeCount;
  }
}
