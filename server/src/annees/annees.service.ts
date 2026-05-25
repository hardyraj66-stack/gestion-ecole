import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AnneeScolaire, AnneeStatut } from './annee.schema';
import { Classe } from '../classes/classe.schema';
import { Eleve } from '../eleves/eleve.schema';
import { Matiere } from '../matieres/matiere.schema';
import { Note } from '../notes/note.schema';
import { Creneau } from '../planning/creneau.schema';
import { PeriodesService } from '../periodes/periodes.service';

@Injectable()
export class AnneesService {
  constructor(
    @InjectModel(AnneeScolaire.name) private model: Model<AnneeScolaire>,
    @InjectModel(Classe.name) private classeModel: Model<Classe>,
    @InjectModel(Eleve.name) private eleveModel: Model<Eleve>,
    @InjectModel(Matiere.name) private matiereModel: Model<Matiere>,
    @InjectModel(Note.name) private noteModel: Model<Note>,
    @InjectModel(Creneau.name) private creneauModel: Model<Creneau>,
    private readonly periodesService: PeriodesService,
  ) {}

  findAll() {
    return this.model.find().sort({ debut: -1 }).exec();
  }

  findById(id: string) {
    return this.model.findById(id).exec();
  }

  findActive() {
    return this.model.findOne({ statut: 'active' }).exec();
  }

  findByStatut(statut: AnneeStatut) {
    return this.model.find({ statut }).exec();
  }

  async create(data: { label: string; debut: string; fin: string }) {
    const existing = await this.model.findOne({ label: data.label }).exec();
    if (existing) {
      throw new BadRequestException(`L'année scolaire "${data.label}" existe déjà`);
    }

    const annee = new this.model({
      ...data,
      statut: 'preparation',
      historique: [{
        action: 'creation',
        date: new Date().toISOString(),
        details: `Année scolaire "${data.label}" créée en préparation`,
      }],
    });

    return annee.save();
  }

  async update(id: string, data: Partial<{ label: string; debut: string; fin: string }>) {
    const annee = await this.model.findById(id).exec();
    if (!annee) return null;

    if (annee.statut === 'terminee') {
      throw new BadRequestException('Impossible de modifier une année scolaire terminée');
    }

    return this.model.findByIdAndUpdate(id, data, { new: true }).exec();
  }

  async delete(id: string) {
    const annee = await this.model.findById(id).exec();
    if (!annee) return false;

    if (annee.statut === 'active') {
      throw new BadRequestException('Impossible de supprimer l\'année scolaire active');
    }
    if (annee.statut === 'terminee') {
      throw new BadRequestException('Impossible de supprimer une année scolaire terminée');
    }

    const result = await this.model.findByIdAndDelete(id).exec();
    return !!result;
  }

  async demarrer(id: string): Promise<AnneeScolaire> {
    const annee = await this.model.findById(id).exec();
    if (!annee) throw new BadRequestException('Année scolaire introuvable');

    if (annee.statut !== 'preparation') {
      throw new BadRequestException(
        `Impossible de démarrer : l'année est en statut "${annee.statut}". Seule une année en "préparation" peut être démarrée.`
      );
    }

    const active = await this.model.findOne({ statut: 'active' }).exec();
    if (active) {
      throw new BadRequestException(
        `L'année "${active.label}" est encore active. Terminez-la d'abord avant d'en démarrer une nouvelle.`
      );
    }

    annee.statut = 'active';
    annee.historique.push({
      action: 'demarrage',
      date: new Date().toISOString(),
      details: `Année scolaire "${annee.label}" démarrée officiellement`,
    });

    await annee.save();
    await this.periodesService.initForAnnee(annee.label, annee.debut);
    return annee;
  }

  async terminer(id: string): Promise<{ terminee: AnneeScolaire; nouvelle: AnneeScolaire }> {
    const annee = await this.model.findById(id).exec();
    if (!annee) throw new BadRequestException('Année scolaire introuvable');

    if (annee.statut !== 'active') {
      throw new BadRequestException(
        `Impossible de terminer : l'année est en statut "${annee.statut}". Seule l'année active peut être terminée.`
      );
    }

    annee.statut = 'terminee';
    annee.historique.push({
      action: 'cloture',
      date: new Date().toISOString(),
      details: `Année scolaire "${annee.label}" terminée`,
    });
    await annee.save();

    const [startYear] = annee.label.split('-').map(Number);
    const newLabel = `${startYear + 1}-${startYear + 2}`;

    let nouvelle = await this.model.findOne({ label: newLabel }).exec();
    if (!nouvelle) {
      nouvelle = new this.model({
        label: newLabel,
        debut: `${startYear + 1}-09-01`,
        fin: `${startYear + 2}-07-05`,
        statut: 'preparation',
        historique: [{
          action: 'creation_auto',
          date: new Date().toISOString(),
          details: `Année "${newLabel}" créée automatiquement après clôture de "${annee.label}"`,
        }],
      });
      await nouvelle.save();
    }

    return { terminee: annee, nouvelle };
  }

  // ============ SNAPSHOT d'une année ============
  async getSnapshot(id: string) {
    const annee = await this.model.findById(id).exec();
    if (!annee) return null;

    // Classes de cette année
    const classes = await this.classeModel.find({ annee_scolaire: annee.label }).exec();
    const classeIds = classes.map(c => (c as any)._id.toString());

    // Élèves dans ces classes
    const eleves = await this.eleveModel.find({ classe_id: { $in: classeIds } }).exec();
    const eleveIds = eleves.map(e => (e as any)._id.toString());

    // Notes de ces élèves
    const notes = await this.noteModel.find({ eleve_id: { $in: eleveIds } }).exec();

    // Créneaux de ces classes
    const creneaux = await this.creneauModel.find({ classe_id: { $in: classeIds } }).exec();

    // Matières (toujours toutes)
    const matieres = await this.matiereModel.find().exec();

    return {
      annee,
      classes,
      eleves,
      notes,
      creneaux,
      matieres,
    };
  }
}
