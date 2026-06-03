import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Salle } from './salle.schema';
import { Creneau } from '../planning/creneau.schema';
import { Classe } from '../classes/classe.schema';
import { AnneeScolaire } from '../annees/annee.schema';

export interface SalleDisponible {
  id: string;
  nom: string;
  capacite: number;
  description: string;
  type: string;
  equipements: string[];
  accessible_pmr: boolean;
  batiment: string;
  etage: string;
  disponible: boolean;
  occupant: { classe_id: string; matiere_nom: string; heure_debut: string; heure_fin: string } | null;
}

export interface SalleUsageInfo {
  creneaux_actifs: number;
  utilisee: boolean;
}

@Injectable()
export class SallesService {
  constructor(
    @InjectModel(Salle.name) private salleModel: Model<Salle>,
    @InjectModel(Creneau.name) private creneauModel: Model<Creneau>,
    @InjectModel(Classe.name) private classeModel: Model<Classe>,
    @InjectModel(AnneeScolaire.name) private anneeModel: Model<AnneeScolaire>,
  ) {}

  /** Résout l'année cible pour les écritures : active sinon préparation. */
  private async resolveAnneeCible(): Promise<string> {
    let annee = await this.anneeModel.findOne({ statut: 'active' }).exec();
    if (!annee) annee = await this.anneeModel.findOne({ statut: 'preparation' }).exec();
    if (!annee) throw new BadRequestException('Aucune année scolaire active ou en préparation');
    return (annee as any)._id.toString();
  }

  findAll() { return this.salleModel.find({ actif: { $ne: false } }).exec(); }
  findById(id: string) { return this.salleModel.findById(id).exec(); }

  async create(data: any) {
    const anneeScolaireId = await this.resolveAnneeCible();
    const existing = await this.salleModel.findOne({
      nom: { $regex: `^${data.nom.trim()}$`, $options: 'i' },
      anneeScolaireId,
      actif: { $ne: false },
    }).exec();
    if (existing) throw new BadRequestException(`Une salle nommée « ${data.nom.trim()} » existe déjà`);
    return new this.salleModel({ ...data, anneeScolaireId }).save();
  }

  async update(id: string, data: any) {
    if (data.nom) {
      const current = await this.salleModel.findById(id).exec();
      const existing = await this.salleModel.findOne({
        nom: { $regex: `^${data.nom.trim()}$`, $options: 'i' },
        anneeScolaireId: (current as any)?.anneeScolaireId ?? '',
        _id: { $ne: id },
        actif: { $ne: false },
      }).exec();
      if (existing) throw new BadRequestException(`Une salle nommée « ${data.nom.trim()} » existe déjà`);
    }
    return this.salleModel.findByIdAndUpdate(id, data, { new: true }).exec();
  }

  async checkUsage(id: string): Promise<SalleUsageInfo> {
    const salle = await this.salleModel.findById(id).exec();
    if (!salle) return { creneaux_actifs: 0, utilisee: false };
    const count = await this.creneauModel.countDocuments({ salle: salle.nom }).exec();
    return { creneaux_actifs: count, utilisee: count > 0 };
  }

  async delete(id: string) {
    const result = await this.salleModel.findByIdAndUpdate(id, { actif: false }, { new: true }).exec();
    return !!result;
  }

  async getSalleStats(id: string) {
    const salle = await this.salleModel.findById(id).exec();
    if (!salle) return null;
    const s = salle.toJSON() as any;

    const creneaux = await this.creneauModel.find({ salle: s.nom }).exec();

    // Joindre le nom de classe sur chaque créneau
    const classeIds = [...new Set(creneaux.map(c => c.classe_id))];
    const classes = await this.classeModel.find({ _id: { $in: classeIds } }).exec();
    const classeMap = new Map(classes.map(c => [c._id.toString(), c.nom]));

    const joursUniques = new Set(creneaux.map(c => c.jour)).size;
    const heuresParSemaine = creneaux.reduce((acc, c) => {
      return acc + (this.toMinutes(c.heure_fin) - this.toMinutes(c.heure_debut)) / 60;
    }, 0);

    const heuresDispo = 5 * 8;
    const tauxOccupation = heuresDispo > 0 ? Math.round((heuresParSemaine / heuresDispo) * 100) : 0;

    return {
      salle: s,
      stats: {
        creneaux_par_semaine: creneaux.length,
        jours_utilises: joursUniques,
        heures_par_semaine: Math.round(heuresParSemaine * 10) / 10,
        taux_occupation: Math.min(tauxOccupation, 100),
      },
      creneaux: creneaux.map(c => {
        const cj = (c as any).toJSON ? (c as any).toJSON() : c;
        return { ...cj, classe_nom: classeMap.get(c.classe_id) || '' };
      }),
    };
  }

  async getDisponibles(jour: string, heureDebut: string, heureFin: string, excludeCreneauId?: string): Promise<SalleDisponible[]> {
    const allSalles = await this.salleModel.find({ actif: { $ne: false } }).exec();
    const allCreneaux = await this.creneauModel.find({ jour }).exec();

    const hd = this.toMinutes(heureDebut);
    const hf = this.toMinutes(heureFin);

    // Pré-charger les noms de classe pour les créneaux en conflit potentiel
    const classeIds = [...new Set(allCreneaux.map(c => c.classe_id))];
    const classes = await this.classeModel.find({ _id: { $in: classeIds } }).exec();
    const classeMap = new Map(classes.map(c => [c._id.toString(), c.nom]));

    return allSalles.map(salle => {
      const s = salle.toJSON() as any;

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
        equipements: s.equipements || [],
        accessible_pmr: s.accessible_pmr || false,
        batiment: s.batiment || '',
        etage: s.etage || '',
        disponible: !conflict,
        occupant: conflict ? {
          classe_id: conflict.classe_id,
          classe_nom: classeMap.get(conflict.classe_id) || '',
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
