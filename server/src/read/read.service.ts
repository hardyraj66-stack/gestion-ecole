import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ReadClasse } from './schemas/read-classe.schema';
import { ReadEleve } from './schemas/read-eleve.schema';
import { ReadMatiere } from './schemas/read-matiere.schema';
import { ReadNote } from './schemas/read-note.schema';
import { ReadCreneau } from './schemas/read-creneau.schema';
import { ReadSalle } from './schemas/read-salle.schema';
import { ReadEvaluation } from './schemas/read-evaluation.schema';
import { PeriodeEvaluation } from '../periodes/periode.schema';
import { AnneeScolaire } from '../annees/annee.schema';
import { Convocation } from '../suivi/convocation.schema';
import { Niveau } from '../niveaux/niveau.schema';
import { Professeur } from '../professeurs/professeur.schema';
import { TeacherAssignment } from '../teacher-assignments/teacher-assignment.schema';

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
    @InjectModel(Niveau.name) private niveauModel: Model<Niveau>,
    @InjectModel(Professeur.name) private professeurModel: Model<Professeur>,
    @InjectModel(TeacherAssignment.name) private assignmentModel: Model<TeacherAssignment>,
    @InjectModel(ReadEvaluation.name) private readEvaluationModel: Model<ReadEvaluation>,
    @InjectModel(PeriodeEvaluation.name) private periodeModel: Model<PeriodeEvaluation>,
  ) {}

  // ============ HELPERS ============
  private async resolveAnneeLabel(anneeLabel?: string): Promise<string | null> {
    if (anneeLabel) return anneeLabel;
    const annee = await this.anneeModel.findOne({ statut: 'active' }).exec();
    return annee?.label ?? null;
  }

  /** @deprecated use resolveAnneeLabel */
  private async getAnneeActiveLabel(): Promise<string | null> {
    return this.resolveAnneeLabel();
  }

  // ============ DASHBOARD ============
  async getDashboard(classesPage = 1, classesLimit = 5, anneeLabel?: string): Promise<any> {
    const today = new Date().toISOString().slice(0, 10);
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    const resolvedLabel = await this.resolveAnneeLabel(anneeLabel);

    const [anneeActive, convocations] = await Promise.all([
      this.anneeModel.findOne({ statut: 'active' }).exec(),
      anneeLabel ? Promise.resolve([]) : this.convocationModel.find({
        $or: [
          { date: { $gte: yesterday }, effectuee: false },
          { date: today },
          { date: yesterday },
        ],
      }).sort({ date: 1 }).exec(),
    ]);

    const classeFilter = resolvedLabel ? { annee_scolaire: resolvedLabel } : {};

    // En mode archive, les stats (élèves, notes) sont filtrés sur l'année archivée
    let elevesCount: number;
    let notesCount: number;
    if (anneeLabel) {
      const classeIds = (await this.readClasseModel.find(classeFilter, { source_id: 1 }).exec()).map(c => c.source_id);
      const eleveIds = (await this.readEleveModel.find({ classe_id: { $in: classeIds } }, { source_id: 1 }).exec()).map(e => e.source_id);
      [elevesCount, notesCount] = await Promise.all([
        this.readEleveModel.countDocuments({ classe_id: { $in: classeIds } }).exec(),
        this.readNoteModel.countDocuments({ eleve_id: { $in: eleveIds } }).exec(),
      ]);
    } else {
      [elevesCount, notesCount] = await Promise.all([
        this.readEleveModel.countDocuments().exec(),
        this.readNoteModel.countDocuments().exec(),
      ]);
    }

    const [classesTotal, matieresCount, recentEleves] = await Promise.all([
      this.readClasseModel.countDocuments(classeFilter).exec(),
      this.readMatiereModel.countDocuments().exec(),
      this.readEleveModel.find().sort({ _id: -1 }).limit(5).exec(),
    ]);

    // Convocations enrichies (mode live seulement)
    let convocationsEnrichies: any[] = [];
    if (!anneeLabel && Array.isArray(convocations) && convocations.length > 0) {
      const eleveIds = [...new Set((convocations as any[]).map((c: any) => c.eleve_id))];
      const eleves = await this.readEleveModel.find({ source_id: { $in: eleveIds } }).exec();
      const eleveMap = new Map(eleves.map(e => [e.source_id, e.toJSON()]));
      convocationsEnrichies = (convocations as any[]).map((c: any) => ({
        ...c.toJSON(),
        eleve: eleveMap.get(c.eleve_id) || null,
        periode: c.date === today ? 'today' : c.date === yesterday ? 'yesterday' : 'upcoming',
      }));
    }

    const classes = await this.readClasseModel.find(classeFilter)
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
  async getClassesList(page = 1, limit = 8, search = '', niveau = '', anneeLabel?: string) {
    const resolvedLabel = await this.resolveAnneeLabel(anneeLabel);
    const filter: any = resolvedLabel ? { annee_scolaire: resolvedLabel } : {};
    if (search) filter.nom = { $regex: search, $options: 'i' };
    if (niveau) filter.niveau = niveau;

    const sallesFilter: any = resolvedLabel
      ? { salle_type: 'fixe', salle: { $ne: '' }, annee_scolaire: resolvedLabel }
      : { salle_type: 'fixe', salle: { $ne: '' } };

    const [items, total, niveauxConfig, distinctNiveaux, sallesFixe] = await Promise.all([
      this.readClasseModel.find(filter).skip((page - 1) * limit).limit(limit).exec(),
      this.readClasseModel.countDocuments(filter).exec(),
      this.niveauModel.find().sort({ ordre: 1 }).exec(),
      this.readClasseModel.distinct('niveau', resolvedLabel ? { annee_scolaire: resolvedLabel } : {}).exec(),
      this.readClasseModel.find(sallesFilter, { source_id: 1, salle: 1, nom: 1 }).exec(),
    ]);

    // Niveaux dans l'ordre configuré, puis orphelins à la fin
    const configuredNoms = niveauxConfig.map(n => n.nom);
    const orphelins = (distinctNiveaux as string[]).filter(n => !configuredNoms.includes(n)).sort();
    const niveaux = [...configuredNoms.filter(n => (distinctNiveaux as string[]).includes(n)), ...orphelins];

    return {
      items: items.map(c => c.toJSON()),
      niveaux,
      total, page, limit,
      totalPages: Math.ceil(total / limit),
      sallesOccupees: sallesFixe.map(c => ({ classeId: c.source_id, classNom: c.nom, salle: c.salle })),
    };
  }

  // ============ CLASSE ELEVES ============
  async getClasseEleves(classeId: string, page = 1, limit = 10, search = '', eleveId = '', anneeLabel?: string) {
    // Chercher la classe en tenant compte de l'année si fournie
    const classeFilter: any = { source_id: classeId };
    if (anneeLabel) classeFilter.annee_scolaire = anneeLabel;
    const classe = await this.readClasseModel.findOne(classeFilter).exec();
    if (!classe) return null;

    // Toujours filtrer les élèves par l'année de la classe
    const filter: any = { classe_id: classeId };
    const annee = anneeLabel || (classe as any).annee_scolaire;
    if (annee) filter.annee_scolaire = annee;
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
  async getElevesList(page = 1, limit = 12, search = '', classeId = '', eleveId = '', anneeLabel?: string) {
    const resolvedLabel = await this.resolveAnneeLabel(anneeLabel);
    const filter: any = {};
    // Toujours filtrer par annee_scolaire pour isoler les années
    if (resolvedLabel) filter.annee_scolaire = resolvedLabel;
    if (eleveId) {
      filter.source_id = eleveId;
    } else {
      if (classeId) {
        filter.classe_id = classeId;
      } else if (resolvedLabel && !classeId) {
        // Filtre année déjà appliqué via filter.annee_scolaire
      }
      if (search) {
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
    }

    const [items, total, totalAll] = await Promise.all([
      this.readEleveModel.find(filter).skip((page - 1) * limit).limit(limit).exec(),
      this.readEleveModel.countDocuments(filter).exec(),
      this.readEleveModel.countDocuments().exec(),
    ]);

    return {
      eleves: items.map(e => e.toJSON()),
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
  async getPlanningClasses(anneeLabel?: string) {
    const resolvedLabel = await this.resolveAnneeLabel(anneeLabel);
    const classeFilter = resolvedLabel ? { annee_scolaire: resolvedLabel } : {};
    const [classes, creneaux] = await Promise.all([
      this.readClasseModel.find(classeFilter).exec(),
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
    const [classe, creneaux, allMatieres, assignments] = await Promise.all([
      this.readClasseModel.findOne({ source_id: classeId }).exec(),
      this.readCreneauModel.find({ classe_id: classeId }).exec(),
      this.readMatiereModel.find().exec(),
      this.assignmentModel.find({ classe_id: classeId }).lean().exec(),
    ]);

    if (!classe) return null;

    // Récupérer les matières autorisées pour le niveau (pour marquer les non-autorisées)
    let allowedMatiereIds: string[] | null = null;
    if (classe.niveau) {
      const niveau = await this.niveauModel.findOne({ nom: classe.niveau }).lean().exec();
      const ids: string[] = (niveau as any)?.matiere_ids ?? [];
      if (ids.length > 0) allowedMatiereIds = ids;
    }

    // Matières filtrées pour le planning (seulement les autorisées)
    const matieres = allowedMatiereIds
      ? allMatieres.filter(m => allowedMatiereIds!.includes(m.source_id))
      : allMatieres;

    const profIds = [...new Set((assignments as any[]).map((a: any) => a.professeur_id).filter(Boolean))];
    const profs = profIds.length > 0
      ? await this.professeurModel.find({ _id: { $in: profIds } }).lean().exec()
      : [];
    const pm = new Map((profs as any[]).map((p: any) => [p._id.toString(), p]));
    const assignmentsEnriched = (assignments as any[]).map((a: any) => {
      const p = pm.get(a.professeur_id);
      return { ...a, id: a._id.toString(), professeur_nom: p ? `${p.prenom} ${p.nom}` : '' };
    });

    // Toutes les matières avec flag autorisee (pour la page affectations)
    const allMatieresWithFlag = allMatieres.map(m => ({
      ...(m.toJSON() as any),
      autorisee: allowedMatiereIds === null || allowedMatiereIds.includes(m.source_id),
    }));

    return {
      classe: classe.toJSON(),
      creneaux: creneaux.map(c => c.toJSON()),
      matieres: matieres.map(m => m.toJSON()),
      allMatieres: allMatieresWithFlag,
      assignments: assignmentsEnriched,
    };
  }

  // ============ NOTES PAGE — filtres uniquement (pas d'élèves ni de notes) ============
  async getNotesFilters(anneeLabel?: string) {
    const resolvedLabel = await this.resolveAnneeLabel(anneeLabel);
    const classeFilter = resolvedLabel ? { annee_scolaire: resolvedLabel } : {};
    const [classes, matieres, niveaux] = await Promise.all([
      this.readClasseModel.find(classeFilter).exec(),
      this.readMatiereModel.find().exec(),
      this.niveauModel.find().sort({ ordre: 1, nom: 1 }).lean().exec(),
    ]);
    return {
      classes: classes.map(c => c.toJSON()),
      matieres: matieres.map(m => m.toJSON()),
      niveaux,
    };
  }

  // ============ NOTES PAGE — élèves + notes pour une classe/matière/trimestre ============
  async getNotesEleves(classeId: string, matiereId: string, trimestre: number, anneeLabel?: string) {
    const eleveFilter: any = { classe_id: classeId };
    const noteFilter: any = { matiere_id: matiereId, trimestre };
    if (anneeLabel) {
      noteFilter.annee_scolaire = anneeLabel;
      const classeDoc = await this.readClasseModel.findOne({ source_id: classeId, annee_scolaire: anneeLabel }).exec();
      if (classeDoc) eleveFilter.classe_id = classeDoc.source_id;
    }
    const [eleves, notes] = await Promise.all([
      this.readEleveModel.find(eleveFilter).exec(),
      this.readNoteModel.find(noteFilter).exec(),
    ]);
    return {
      eleves: eleves.map(e => e.toJSON()),
      notes: notes.map(n => n.toJSON()),
    };
  }

  // ============ NOTES PAGE (legacy — conservé pour compatibilité) ============
  async getNotesPage() {
    const anneeLabel = await this.getAnneeActiveLabel();
    const classeFilter = anneeLabel ? { annee_scolaire: anneeLabel } : {};

    const classes = await this.readClasseModel.find(classeFilter).exec();
    const classeIds = classes.map(c => c.source_id);

    const [matieres, eleves, notes, niveaux] = await Promise.all([
      this.readMatiereModel.find().exec(),
      this.readEleveModel.find({ classe_id: { $in: classeIds } }).exec(),
      this.readNoteModel.find().exec(),
      this.niveauModel.find().sort({ ordre: 1, nom: 1 }).lean().exec(),
    ]);
    return {
      classes: classes.map(c => c.toJSON()),
      matieres: matieres.map(m => m.toJSON()),
      eleves: eleves.map(e => e.toJSON()),
      notes: notes.map(n => n.toJSON()),
      niveaux,
    };
  }

  // ============ BULLETIN ============
  async getBulletin(eleveId: string, trimestre: number, anneeLabel?: string) {
    const resolvedLabel = await this.resolveAnneeLabel(anneeLabel);
    // En mode archive, chercher l'entrée read_eleve pour cette année spécifique
    const eleveFilter: any = { source_id: eleveId };
    if (resolvedLabel) eleveFilter.annee_scolaire = resolvedLabel;
    const eleve = await this.readEleveModel.findOne(eleveFilter).exec();
    if (!eleve) return null;
    const classe = await this.readClasseModel.findOne({ source_id: eleve.classe_id }).exec();

    // Filtrer les notes par annee_scolaire si fourni
    const noteFilter: any = { eleve_id: eleveId, trimestre };
    if (resolvedLabel) noteFilter.annee_scolaire = resolvedLabel;
    const notes = await this.readNoteModel.find(noteFilter).exec();

    const matieres = await this.readMatiereModel.find().exec();
    const niveau = (classe?.toJSON() as any)?.niveau;

    const matiereMap = new Map<string, { ds: number | null; evaluation: number | null; matiere_nom: string; matiere_code: string }>();
    for (const n of notes) {
      const nj = n.toJSON() as any;
      if (!matiereMap.has(nj.matiere_id)) {
        matiereMap.set(nj.matiere_id, { ds: null, evaluation: null, matiere_nom: nj.matiere_nom, matiere_code: nj.matiere_code });
      }
      const entry = matiereMap.get(nj.matiere_id)!;
      if (nj.type === 'ds') entry.ds = nj.valeur;
      else if (nj.type === 'evaluation') entry.evaluation = nj.valeur;
    }

    const bulletin = Array.from(matiereMap).map(([mid, data]) => {
      const mat = matieres.find(m => m.source_id === mid);
      const matJson = mat?.toJSON() as any;
      const coefficients: Array<{ niveau: string; coefficient: number }> = matJson?.coefficients || [];
      let coeff = matJson?.coefficient ?? 1;
      if (niveau && coefficients.length > 0) {
        const found = coefficients.find((c: any) => c.niveau === niveau);
        if (found) coeff = found.coefficient;
      } else if (coefficients.length === 1) {
        coeff = coefficients[0].coefficient;
      }
      const vals = [data.ds, data.evaluation].filter(v => v !== null) as number[];
      const moyenne = vals.length > 0 ? Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10 : 0;
      return { matiere_id: mid, matiere_nom: data.matiere_nom, code: data.matiere_code, coefficient: coeff, ds: data.ds, evaluation: data.evaluation, moyenne };
    });

    return { eleve: eleve.toJSON(), classe: classe?.toJSON() || null, bulletin };
  }

  // ============ PÉRIODES D'ÉVALUATION ============
  async getPeriodes(annee_scolaire: string) {
    const periodes = await this.periodeModel.find({ annee_scolaire }).sort({ trimestre: 1, type: 1 }).exec();
    const today = new Date().toISOString().slice(0, 10);
    return periodes.map(p => {
      const json = p.toJSON() as any;
      if (json.terminee) json.statut = 'terminee';
      else if (!json.date_debut || !json.date_fin) json.statut = 'non-planifiee';
      else if (today >= json.date_debut && today <= json.date_fin) json.statut = 'active';
      else if (today < json.date_debut) json.statut = 'future';
      else json.statut = 'terminee';
      return json;
    });
  }

  async getActivePeriode() {
    const today = new Date().toISOString().slice(0, 10);
    return this.periodeModel.findOne({
      terminee: { $ne: true },
      date_debut: { $lte: today },
      date_fin: { $gte: today },
    }).exec();
  }

  // ============ EVALUATIONS ============
  async getEvaluationsList(
    classeId?: string, matiereId?: string, trimestre?: number, statut?: string, page = 1, limit = 10, anneeLabel?: string
  ) {
    const resolvedLabel = await this.resolveAnneeLabel(anneeLabel);
    const filter: any = {};
    if (resolvedLabel) filter.annee_scolaire = resolvedLabel;
    if (classeId) filter.classe_id = classeId;
    if (matiereId) filter.matiere_id = matiereId;
    if (trimestre) filter.trimestre = trimestre;
    if (statut) filter.statut = statut;

    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.readEvaluationModel.find(filter).sort({ date: -1 }).skip(skip).limit(limit).exec(),
      this.readEvaluationModel.countDocuments(filter).exec(),
    ]);

    return {
      items: items.map(e => e.toJSON()),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getEvaluationDetail(id: string) {
    const evaluation = await this.readEvaluationModel.findOne({ source_id: id }).exec();
    return evaluation ? evaluation.toJSON() : null;
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

  // ============ PROFESSEURS ============
  async getProfesseursList(page = 1, limit = 20, search = '') {
    const filter: any = { statut: { $ne: 'inactif' } };
    if (search) {
      filter.$or = [
        { nom: { $regex: search, $options: 'i' } },
        { prenom: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }
    const [items, total] = await Promise.all([
      this.professeurModel.find(filter).skip((page - 1) * limit).limit(limit).exec(),
      this.professeurModel.countDocuments(filter).exec(),
    ]);
    return {
      items: items.map((p: any) => p.toJSON()),
      total, page, limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getProfesseursActifs() {
    const profs = await this.professeurModel.find({ statut: 'actif' }).exec();
    return profs.map((p: any) => p.toJSON());
  }

  async getProfesseurDetail(id: string) {
    const prof = await this.professeurModel.findById(id).exec();
    if (!prof) return null;
    const assignments = await this.assignmentModel.find({ professeur_id: id }).lean().exec();

    const classeIds = [...new Set(assignments.map((a: any) => a.classe_id))];
    const matiereIds = [...new Set(assignments.map((a: any) => a.matiere_id))];
    const [classes, matieres] = await Promise.all([
      this.readClasseModel.find({ source_id: { $in: classeIds } }).lean().exec(),
      this.readMatiereModel.find({ source_id: { $in: matiereIds } }).lean().exec(),
    ]);
    const classeMap = new Map((classes as any[]).map((c: any) => [c.source_id, c.nom]));
    const matiereMap = new Map((matieres as any[]).map((m: any) => [m.source_id, { nom: m.nom, couleur: m.couleur }]));

    const assignmentsEnriched = assignments.map((a: any) => ({
      ...a,
      id: a._id.toString(),
      classe_nom: classeMap.get(a.classe_id) || a.classe_id,
      matiere_nom: matiereMap.get(a.matiere_id)?.nom || a.matiere_id,
      matiere_couleur: matiereMap.get(a.matiere_id)?.couleur || '#64748b',
    }));

    return { professeur: (prof as any).toJSON(), assignments: assignmentsEnriched };
  }

  async getCreateClasseData() { return { salles: (await this.readSalleModel.find().exec()).map(s => s.toJSON()) }; }
  // ============ NIVEAUX (léger) ============
  async getNiveaux(anneeLabel?: string) {
    const resolvedLabel = await this.resolveAnneeLabel(anneeLabel);
    const classeFilter = resolvedLabel ? { annee_scolaire: resolvedLabel } : {};
    const [niveauxConfig, classes] = await Promise.all([
      this.niveauModel.find().sort({ ordre: 1, nom: 1 }).lean().exec(),
      this.readClasseModel.find(classeFilter).exec(),
    ]);

    // Comptage des classes par niveau
    const countMap = new Map<string, number>();
    for (const c of classes) {
      const n = c.niveau || 'Autre';
      countMap.set(n, (countMap.get(n) || 0) + 1);
    }

    if (niveauxConfig.length > 0) {
      // Retourner dans l'ordre défini par la config, puis les niveaux orphelins
      const configured = niveauxConfig.map((n: any) => ({
        niveau: n.nom,
        count: countMap.get(n.nom) || 0,
        ordre: n.ordre,
        description: n.description || '',
        matiere_ids: n.matiere_ids || [],
        id: n._id.toString(),
      }));
      const configuredNoms = new Set(niveauxConfig.map((n: any) => n.nom));
      const orphans = Array.from(countMap.entries())
        .filter(([nom]) => !configuredNoms.has(nom))
        .map(([nom, count]) => ({ niveau: nom, count, ordre: 999, description: '', matiere_ids: [], id: null }));
      return [...configured, ...orphans];
    }

    // Fallback : agrégation depuis les classes si aucun niveau configuré
    const ordre = ['CP','CE1','CE2','CM1','CM2','6ème','5ème','4ème','3ème','2nde','1ère','Terminale'];
    return Array.from(countMap.entries())
      .sort(([a], [b]) => {
        const ia = ordre.indexOf(a), ib = ordre.indexOf(b);
        if (ia === -1 && ib === -1) return a.localeCompare(b);
        if (ia === -1) return 1; if (ib === -1) return -1;
        return ia - ib;
      })
      .map(([niveau, count]) => ({ niveau, count, ordre: 0, description: '', matiere_ids: [], id: null }));
  }

  // ============ CLASSES D'UN NIVEAU + SUGGESTION ============
  async getClassesParNiveau(niveau: string, dateNaissance?: string, anneeLabel?: string) {
    const resolvedLabel = await this.resolveAnneeLabel(anneeLabel);
    const filter: any = { niveau };
    if (resolvedLabel) filter.annee_scolaire = resolvedLabel;
    const classes = await this.readClasseModel.find(filter).exec();
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
  async getEleveFiche(eleveId: string, anneeLabel?: string) {
    const resolvedLabel = await this.resolveAnneeLabel(anneeLabel);
    // En mode archive, chercher l'entrée read_eleve pour cette année spécifique
    const eleveFilter: any = { source_id: eleveId };
    if (resolvedLabel) eleveFilter.annee_scolaire = resolvedLabel;
    const eleve = await this.readEleveModel.findOne(eleveFilter).exec();
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
