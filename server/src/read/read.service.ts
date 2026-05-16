import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ReadClasse } from './schemas/read-classe.schema';
import { ReadEleve } from './schemas/read-eleve.schema';
import { ReadMatiere } from './schemas/read-matiere.schema';
import { ReadNote } from './schemas/read-note.schema';
import { ReadCreneau } from './schemas/read-creneau.schema';
import { ReadSalle } from './schemas/read-salle.schema';
import { AnneeScolaire } from '../annees/annee.schema';

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Injectable()
export class ReadService {
  constructor(
    @InjectModel(ReadClasse.name) private readClasseModel: Model<ReadClasse>,
    @InjectModel(ReadEleve.name) private readEleveModel: Model<ReadEleve>,
    @InjectModel(ReadMatiere.name) private readMatiereModel: Model<ReadMatiere>,
    @InjectModel(ReadNote.name) private readNoteModel: Model<ReadNote>,
    @InjectModel(ReadCreneau.name) private readCreneauModel: Model<ReadCreneau>,
    @InjectModel(ReadSalle.name) private readSalleModel: Model<ReadSalle>,
    @InjectModel(AnneeScolaire.name) private anneeModel: Model<AnneeScolaire>,
  ) {}

  // ============ DASHBOARD ============
  async getDashboard(classesPage = 1, classesLimit = 5) {
    const [classesTotal, elevesCount, matieresCount, notesCount, anneeActive, recentEleves] = await Promise.all([
      this.readClasseModel.countDocuments().exec(),
      this.readEleveModel.countDocuments().exec(),
      this.readMatiereModel.countDocuments().exec(),
      this.readNoteModel.countDocuments().exec(),
      this.anneeModel.findOne({ statut: 'active' }).exec(),
      this.readEleveModel.find().sort({ _id: -1 }).limit(5).exec(),
    ]);

    const classes = await this.readClasseModel.find()
      .skip((classesPage - 1) * classesLimit).limit(classesLimit).exec();

    return {
      stats: { classes: classesTotal, eleves: elevesCount, matieres: matieresCount, notes: notesCount },
      classesWithCount: classes.map(c => c.toJSON()),
      classesTotal,
      classesPagination: { page: classesPage, limit: classesLimit, total: classesTotal, totalPages: Math.ceil(classesTotal / classesLimit) },
      recentEleves: recentEleves.map(e => e.toJSON()),
      anneeActive: anneeActive?.toJSON() || null,
    };
  }

  // ============ CLASSES LIST ============
  async getClassesList(page = 1, limit = 8, search = '') {
    const filter: any = {};
    if (search) filter.nom = { $regex: search, $options: 'i' };

    const [items, total] = await Promise.all([
      this.readClasseModel.find(filter).skip((page - 1) * limit).limit(limit).exec(),
      this.readClasseModel.countDocuments(filter).exec(),
    ]);

    return {
      items: items.map(c => c.toJSON()),
      total, page, limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // ============ CLASSE ELEVES ============
  async getClasseEleves(classeId: string, page = 1, limit = 10, search = '') {
    const classe = await this.readClasseModel.findOne({ source_id: classeId }).exec();
    if (!classe) return null;

    const filter: any = { classe_id: classeId };
    if (search) {
      filter.$or = [
        { nom: { $regex: search, $options: 'i' } },
        { prenom: { $regex: search, $options: 'i' } },
      ];
    }

    const [items, total] = await Promise.all([
      this.readEleveModel.find(filter).skip((page - 1) * limit).limit(limit).exec(),
      this.readEleveModel.countDocuments(filter).exec(),
    ]);

    return {
      classe: classe.toJSON(),
      eleves: items.map(e => e.toJSON()),
      total, page, limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // ============ ELEVES LIST ============
  async getElevesList(page = 1, limit = 12, search = '', classeId = '') {
    const filter: any = {};
    if (classeId) filter.classe_id = classeId;
    if (search) {
      filter.$or = [
        { nom: { $regex: search, $options: 'i' } },
        { prenom: { $regex: search, $options: 'i' } },
      ];
    }

    const [items, total, classes] = await Promise.all([
      this.readEleveModel.find(filter).skip((page - 1) * limit).limit(limit).exec(),
      this.readEleveModel.countDocuments(filter).exec(),
      this.readClasseModel.find().exec(),
    ]);

    const totalAll = await this.readEleveModel.countDocuments().exec();

    return {
      eleves: items.map(e => e.toJSON()),
      classes: classes.map(c => { const j = c.toJSON(); return { id: j.id, nom: j.nom, niveau: j.niveau }; }),
      total, totalAll, page, limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // ============ MATIERES LIST ============
  async getMatieresList(page = 1, limit = 8) {
    const [items, total] = await Promise.all([
      this.readMatiereModel.find().skip((page - 1) * limit).limit(limit).exec(),
      this.readMatiereModel.countDocuments().exec(),
    ]);
    return {
      items: items.map(m => m.toJSON()),
      total, page, limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // ============ SALLES LIST ============
  async getSallesList(page = 1, limit = 8) {
    const [items, total] = await Promise.all([
      this.readSalleModel.find().skip((page - 1) * limit).limit(limit).exec(),
      this.readSalleModel.countDocuments().exec(),
    ]);
    return {
      items: items.map(s => s.toJSON()),
      total, page, limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // ============ PLANNING — liste des niveaux/classes (léger) ============
  async getPlanningClasses() {
    const [classes, creneaux] = await Promise.all([
      this.readClasseModel.find().exec(),
      this.readCreneauModel.find().lean().exec(),
    ]);

    const classesJson = classes.map(c => {
      const cj = c.toJSON() as any;
      cj._creneauxCount = creneaux.filter((cr: any) => cr.classe_id === c.source_id).length;
      return cj;
    });

    return { classes: classesJson };
  }

  // ============ PLANNING — créneaux d'UNE classe ============
  async getPlanningClasse(classeId: string) {
    const [classe, creneaux, matieres] = await Promise.all([
      this.readClasseModel.findOne({ source_id: classeId }).exec(),
      this.readCreneauModel.find({ classe_id: classeId }).exec(),
      this.readMatiereModel.find().exec(),
    ]);

    if (!classe) return null;

    return {
      classe: classe.toJSON(),
      creneaux: creneaux.map(c => c.toJSON()),
      matieres: matieres.map(m => m.toJSON()),
    };
  }

  // ============ NOTES PAGE ============
  async getNotesPage() {
    const [classes, matieres, eleves, notes] = await Promise.all([
      this.readClasseModel.find().exec(),
      this.readMatiereModel.find().exec(),
      this.readEleveModel.find().exec(),
      this.readNoteModel.find().exec(),
    ]);
    return {
      classes: classes.map(c => c.toJSON()),
      matieres: matieres.map(m => m.toJSON()),
      eleves: eleves.map(e => e.toJSON()),
      notes: notes.map(n => n.toJSON()),
    };
  }

  // ============ BULLETIN ============
  async getBulletin(eleveId: string, trimestre: number) {
    const eleve = await this.readEleveModel.findOne({ source_id: eleveId }).exec();
    if (!eleve) return null;
    const classe = await this.readClasseModel.findOne({ source_id: eleve.classe_id }).exec();
    const eleveNotes = await this.readNoteModel.find({ eleve_id: eleveId, trimestre }).exec();
    const matieres = await this.readMatiereModel.find().exec();

    const map = new Map<string, number[]>();
    for (const n of eleveNotes) { if (!map.has(n.matiere_id)) map.set(n.matiere_id, []); map.get(n.matiere_id)!.push(n.valeur); }

    const bulletin = Array.from(map).map(([mid, vals]) => {
      const mat = matieres.find(m => m.source_id === mid);
      if (!mat) return null;
      const moy = Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10;
      return { matiere_id: mid, matiere_nom: mat.nom, code: mat.code, coefficient: mat.coefficient, notes: vals, moyenne: moy };
    }).filter(Boolean);

    return { eleve: eleve.toJSON(), classe: classe?.toJSON() || null, bulletin };
  }

  // ============ SNAPSHOT ARCHIVE ============
  async getAnneeSnapshot(anneeId: string) {
    const annee = await this.anneeModel.findById(anneeId).exec();
    if (!annee) return null;
    const classes = await this.readClasseModel.find({ annee_scolaire: annee.label }).exec();
    const sids = classes.map(c => c.source_id);
    const [eleves, creneaux, matieres] = await Promise.all([
      this.readEleveModel.find({ classe_id: { $in: sids } }).exec(),
      this.readCreneauModel.find({ classe_id: { $in: sids } }).exec(),
      this.readMatiereModel.find().exec(),
    ]);
    const eids = eleves.map(e => e.source_id);
    const notes = await this.readNoteModel.find({ eleve_id: { $in: eids } }).exec();
    return {
      annee: annee.toJSON(), classes: classes.map(c => c.toJSON()), eleves: eleves.map(e => e.toJSON()),
      notes: notes.map(n => n.toJSON()), creneaux: creneaux.map(c => c.toJSON()), matieres: matieres.map(m => m.toJSON()),
    };
  }

  async getCreateClasseData() { return { salles: (await this.readSalleModel.find().exec()).map(s => s.toJSON()) }; }
  // ============ NIVEAUX (léger) ============
  async getNiveaux() {
    const classes = await this.readClasseModel.find().exec();
    const map = new Map<string, number>();
    for (const c of classes) {
      const n = c.niveau || 'Autre';
      map.set(n, (map.get(n) || 0) + 1);
    }
    const ordre = ['CP','CE1','CE2','CM1','CM2','6ème','5ème','4ème','3ème','2nde','1ère','Terminale'];
    return Array.from(map.entries())
      .sort(([a], [b]) => {
        const ia = ordre.indexOf(a), ib = ordre.indexOf(b);
        if (ia === -1 && ib === -1) return a.localeCompare(b);
        if (ia === -1) return 1; if (ib === -1) return -1;
        return ia - ib;
      })
      .map(([niveau, count]) => ({ niveau, count }));
  }

  // ============ CLASSES D'UN NIVEAU + SUGGESTION ============
  async getClassesParNiveau(niveau: string, dateNaissance?: string) {
    const classes = await this.readClasseModel.find({ niveau }).exec();
    const sorted = classes.map(c => c.toJSON() as any).sort((a: any, b: any) => a.nom.localeCompare(b.nom));

    const items = sorted.map((c: any) => ({
      id: c.id, nom: c.nom, niveau: c.niveau,
      nb_eleves: c.nb_eleves || 0, capacite: c.capacite || 30,
      places_restantes: (c.capacite || 30) - (c.nb_eleves || 0),
      taux: c.capacite > 0 ? Math.round(((c.nb_eleves || 0) / c.capacite) * 100) : 0,
      pleine: (c.nb_eleves || 0) >= (c.capacite || 30),
    }));

    // Suggestion basée sur l'âge
    // On préfère les classes avec de la place, mais si toutes sont pleines on suggère quand même
    let suggestedId: string | null = null;
    const available = items.filter((c: any) => !c.pleine);
    const pool = available.length > 0 ? available : items; // fallback sur toutes si toutes pleines

    if (pool.length > 0) {
      if (dateNaissance) {
        const birth = new Date(dateNaissance);
        const today = new Date();
        let age = today.getFullYear() - birth.getFullYear();
        const m = today.getMonth() - birth.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;

        const ageRef: Record<string, number> = {
          'CP':6,'CE1':7,'CE2':8,'CM1':9,'CM2':10,
          '6ème':11,'5ème':12,'4ème':13,'3ème':14,
          '2nde':15,'1ère':16,'Terminale':17,
        };
        const ref = ageRef[niveau] || 12;
        suggestedId = age > ref ? pool[pool.length - 1].id : pool[0].id;
      } else {
        // Pas de date → classe avec le plus de places (ou la première si toutes pleines)
        const sorted = [...pool].sort((a: any, b: any) => b.places_restantes - a.places_restantes);
        suggestedId = sorted[0].id;
      }
    }

    return { classes: items, suggestedId };
  }

  async getCreateEleveData() {
    return this.getNiveaux();
  }
}
