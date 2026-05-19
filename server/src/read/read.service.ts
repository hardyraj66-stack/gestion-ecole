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
import { Convocation } from '../suivi/convocation.schema';

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
    @InjectModel(Convocation.name) private convocationModel: Model<Convocation>,
  ) {}

  // ============ DASHBOARD ============
  async getDashboard(classesPage = 1, classesLimit = 5) {
    const today = new Date().toISOString().slice(0, 10);
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

    const [classesTotal, elevesCount, matieresCount, notesCount, anneeActive, recentEleves, convocations] = await Promise.all([
      this.readClasseModel.countDocuments().exec(),
      this.readEleveModel.countDocuments().exec(),
      this.readMatiereModel.countDocuments().exec(),
      this.readNoteModel.countDocuments().exec(),
      this.anneeModel.findOne({ statut: 'active' }).exec(),
      this.readEleveModel.find().sort({ _id: -1 }).limit(5).exec(),
      // Convocations : hier, aujourd'hui, et à venir (non effectuées)
      this.convocationModel.find({
        $or: [
          { date: { $gte: yesterday }, effectuee: false },
          { date: today },
          { date: yesterday },
        ],
      }).sort({ date: 1 }).exec(),
    ]);

    // Enrichir chaque convocation avec les infos de l'élève
    const eleveIds = [...new Set(convocations.map(c => c.eleve_id))];
    const eleves = await this.readEleveModel.find({ source_id: { $in: eleveIds } }).exec();
    const eleveMap = new Map(eleves.map(e => [e.source_id, e.toJSON()]));

    const convocationsEnrichies = convocations.map(c => ({
      ...c.toJSON(),
      eleve: eleveMap.get(c.eleve_id) || null,
      periode: c.date === today ? 'today' : c.date === yesterday ? 'yesterday' : 'upcoming',
    }));

    const classes = await this.readClasseModel.find()
      .skip((classesPage - 1) * classesLimit).limit(classesLimit).exec();

    return {
      stats: { classes: classesTotal, eleves: elevesCount, matieres: matieresCount, notes: notesCount },
      classesWithCount: classes.map(c => c.toJSON()),
      classesTotal,
      classesPagination: { page: classesPage, limit: classesLimit, total: classesTotal, totalPages: Math.ceil(classesTotal / classesLimit) },
      recentEleves: recentEleves.map(e => e.toJSON()),
      anneeActive: anneeActive?.toJSON() || null,
      convocationsRecentes: convocationsEnrichies,
    };
  }

  // ============ CLASSES LIST ============
  async getClassesList(page = 1, limit = 8, search = '', niveau = '') {
    const filter: any = {};
    if (search) filter.nom = { $regex: search, $options: 'i' };
    if (niveau) filter.niveau = niveau;

    const [items, total, allNiveaux] = await Promise.all([
      this.readClasseModel.find(filter).skip((page - 1) * limit).limit(limit).exec(),
      this.readClasseModel.countDocuments(filter).exec(),
      this.readClasseModel.distinct('niveau').exec(),
    ]);

    return {
      items: items.map(c => c.toJSON()),
      niveaux: allNiveaux.sort(),
      total, page, limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // ============ CLASSE ELEVES ============
  async getClasseEleves(classeId: string, page = 1, limit = 10, search = '', eleveId = '') {
    const classe = await this.readClasseModel.findOne({ source_id: classeId }).exec();
    if (!classe) return null;

    const filter: any = { classe_id: classeId };
    if (eleveId) {
      filter.source_id = eleveId;
    } else if (search) {
      const tokens = search.trim().split(/\s+/);
      if (tokens.length >= 2) {
        filter.$and = tokens.map(t => ({
          $or: [
            { nom: { $regex: t, $options: 'i' } },
            { prenom: { $regex: t, $options: 'i' } },
          ],
        }));
      } else {
        filter.$or = [
          { nom: { $regex: search, $options: 'i' } },
          { prenom: { $regex: search, $options: 'i' } },
        ];
      }
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
  async getElevesList(page = 1, limit = 12, search = '', classeId = '', eleveId = '') {
    const filter: any = {};
    if (eleveId) {
      filter.source_id = eleveId;
    } else {
      if (classeId) filter.classe_id = classeId;
      if (search) {
        const tokens = search.trim().split(/\s+/);
        if (tokens.length >= 2) {
          // "Julien Bertrand" → matche prénom OU nom sur chaque token
          filter.$and = tokens.map(t => ({
            $or: [
              { nom: { $regex: t, $options: 'i' } },
              { prenom: { $regex: t, $options: 'i' } },
            ],
          }));
        } else {
          filter.$or = [
            { nom: { $regex: search, $options: 'i' } },
            { prenom: { $regex: search, $options: 'i' } },
          ];
        }
      }
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
  async getMatieresList(page = 1, limit = 8, niveau = '') {
    const filter: any = {};
    if (niveau) filter['coefficients.niveau'] = niveau;
    const [items, total] = await Promise.all([
      this.readMatiereModel.find(filter).skip((page - 1) * limit).limit(limit).exec(),
      this.readMatiereModel.countDocuments(filter).exec(),
    ]);
    return {
      items: items.map(m => m.toJSON()),
      total, page, limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // ============ SALLES LIST ============
  async getSallesList(page = 1, limit = 8, type = '', search = '') {
    const filter: any = {};
    if (type) filter.type = type;
    if (search) filter.nom = { $regex: search, $options: 'i' };

    const [items, total] = await Promise.all([
      this.readSalleModel.find(filter).skip((page - 1) * limit).limit(limit).exec(),
      this.readSalleModel.countDocuments(filter).exec(),
    ]);
    return {
      items: items.map(s => s.toJSON()),
      total, page, limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getSalleDetail(id: string) {
    const salle = await this.readSalleModel.findOne({ source_id: id }).exec();
    if (!salle) return null;
    return salle.toJSON();
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

    const niveau = (classe?.toJSON() as any)?.niveau;
    const bulletin = Array.from(map).map(([mid, vals]) => {
      const mat = matieres.find(m => m.source_id === mid);
      if (!mat) return null;
      const moy = Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10;
      const matJson = mat.toJSON() as any;
      const coefficients: Array<{ niveau: string; coefficient: number }> = matJson.coefficients || [];
      let coeff = matJson.coefficient ?? 1;
      if (niveau && coefficients.length > 0) {
        const found = coefficients.find((c: any) => c.niveau === niveau);
        if (found) coeff = found.coefficient;
      } else if (coefficients.length === 1) {
        coeff = coefficients[0].coefficient;
      }
      return { matiere_id: mid, matiere_nom: mat.nom, code: mat.code, coefficient: coeff, notes: vals, moyenne: moy };
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

  // ============ FICHE ÉLÈVE ============
  async getEleveFiche(eleveId: string) {
    const eleve = await this.readEleveModel.findOne({ source_id: eleveId }).exec();
    if (!eleve) return null;

    const [classe, creneauxClasse, anneeActive] = await Promise.all([
      this.readClasseModel.findOne({ source_id: eleve.classe_id }).exec(),
      this.readCreneauModel.find({ classe_id: eleve.classe_id }).exec(),
      this.anneeModel.findOne({ statut: 'active' }).exec(),
    ]);

    // Salle actuelle : fixe → salle de la classe, variable → laisser vide (résolu côté front via planning)
    const salleActuelle = classe?.salle_type === 'fixe' ? classe.salle : null;

    return {
      eleve: eleve.toJSON(),
      classe: classe?.toJSON() || null,
      salleActuelle,
      creneaux: creneauxClasse.map(c => c.toJSON()),
      anneeActive: anneeActive?.label || null,
    };
  }
}
