import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Salle } from './salle.schema';
import { Creneau } from '../planning/creneau.schema';

export interface SalleDisponible {
  id: string;
  nom: string;
  capacite: number;
  description: string;
  type: string;
  disponible: boolean;
  occupant: { classe_id: string; matiere_nom: string; heure_debut: string; heure_fin: string } | null;
}

@Injectable()
export class SallesService {
  constructor(
    @InjectModel(Salle.name) private salleModel: Model<Salle>,
    @InjectModel(Creneau.name) private creneauModel: Model<Creneau>,
  ) {}

  findAll() { return this.salleModel.find().exec(); }
  findById(id: string) { return this.salleModel.findById(id).exec(); }
  create(data: any) { return new this.salleModel(data).save(); }

  async update(id: string, data: any) {
    return this.salleModel.findByIdAndUpdate(id, data, { new: true }).exec();
  }

  async delete(id: string) {
    const result = await this.salleModel.findByIdAndDelete(id).exec();
    return !!result;
  }

  async getDisponibles(jour: string, heureDebut: string, heureFin: string, excludeCreneauId?: string): Promise<SalleDisponible[]> {
    const allSalles = await this.salleModel.find().exec();
    const allCreneaux = await this.creneauModel.find({ jour }).exec();

    const hd = this.toMinutes(heureDebut);
    const hf = this.toMinutes(heureFin);

    return allSalles.map(salle => {
      const s = salle.toJSON();

      const conflict = allCreneaux.find(c => {
        if (excludeCreneauId && c._id.toString() === excludeCreneauId) return false;
        if (c.salle !== s.nom) return false;
        const cDebut = this.toMinutes(c.heure_debut);
        const cFin = this.toMinutes(c.heure_fin);
        return cDebut < hf && cFin > hd;
      });

      return {
        id: s.id,
        nom: s.nom,
        capacite: s.capacite,
        description: s.description,
        type: s.type,
        disponible: !conflict,
        occupant: conflict ? {
          classe_id: conflict.classe_id,
          matiere_nom: conflict.matiere_nom,
          heure_debut: conflict.heure_debut,
          heure_fin: conflict.heure_fin,
        } : null,
      };
    });
  }

  private toMinutes(time: string): number {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + (m || 0);
  }
}
