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
import { Eleve } from '../eleves/eleve.schema';

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
    @InjectModel(Eleve.name) private eleveModel: Model<Eleve>,
  ) {}

  // ============ HELPERS ============

  /**
   * Résout l'ID de l'année scolaire (nouvelle API normalisée).
   * @param anneeId ID MongoDB de l'AnneeScolaire (si fourni, retourné directement)
   * @returns L'ID de l'année active si aucun ID fourni, null si aucune année active
   */
  private async resolveAnneeId(anneeId?: string): Promise<string | null> {
    if (anneeId) return anneeId;
    const active = await this.anneeModel.findOne({ statut: 'active' }).exec();
    if (active) return (active as any)._id.toString();
    // Pas d'année active → préférer la préparation (nouvelles classes, élèves réinscrits)
    const prep = await this.anneeModel.findOne({ statut: 'preparation' }).exec();
    if (prep) return (prep as any)._id.toString();
    return null;
  }

  /**
   * Résout le LABEL de l'année à partir de son ID (pour l'affichage et l'export).
   * @deprecated — utiliser resolveAnneeId pour les filtres internes
   */
  private async resolveAnneeLabel(anneeIdOrLabel?: string): Promise<string | null> {
    if (!anneeIdOrLabel) {
      const annee = await this.anneeModel.findOne({ statut: 'active' }).exec();
      return annee?.label ?? null;
    }
    // Tenter de résoudre comme ID MongoDB (24 hex chars)
    if (/^[0-9a-fA-F]{24}$/.test(anneeIdOrLabel)) {
      const annee = await this.anneeModel.findById(anneeIdOrLabel).exec();
      return annee?.label ?? null;
    }
    // Déjà un label
    return anneeIdOrLabel;
  }

  /** @deprecated use resolveAnneeId */
  private async getAnneeActiveLabel(): Promise<string | null> {
    const annee = await this.anneeModel.findOne({ statut: 'active' }).exec();
    return annee?.label ?? null;
  }

  // ============ DASHBOARD ============
  async getDashboard(classesPage = 1, classesLimit = 5, anneeId?: string): Promise<any> {
    const today = new Date().toISOString().slice(0, 10);
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    const resolvedId = await this.resolveAnneeId(anneeId);

    const [anneeActive, convocations] = await Promise.all([
      this.anneeModel.findOne({ statut: 'active' }).exec(),
      anneeId ? Promise.resolve([]) : this.convocationModel.find({
        $or: [
          { date: { $gte: yesterday }, effectuee: false },
          { date: today },
          { date: yesterday },
        ],
      }).sort({ date: 1 }).exec(),
    ]);

    const classeFilter = resolvedId ? { anneeScolaireId: resolvedId } : {};

    // En mode archive, les stats (élèves, notes) sont filtrés sur l'année archivée
    let elevesCount: number;
    let notesCount: number;
    if (anneeId) {
      const classeIds = (await this.readClasseModel.find(classeFilter, { source_id: 1 }).lean().exec())
        .map((c: any) => c.source_id);

      const eleveFilter = { anneeScolaireId: resolvedId };
      const [eleveSourceIds, elevesCnt] = await Promise.all([
        this.readEleveModel.find(eleveFilter, { source_id: 1 }).lean().exec(),
        this.readEleveModel.countDocuments(eleveFilter).exec(),
      ]);
      const eleveIds = eleveSourceIds.map((e: any) => e.source_id);
      const [notesCnt] = await Promise.all([
        this.readNoteModel.countDocuments({ eleve_id: { $in: eleveIds } }).exec(),
      ]);
      elevesCount = elevesCnt;
      notesCount = notesCnt;
    } else {
      const activeAnneeId = anneeActive?.id?.toString() ?? anneeActive?._id?.toString() ?? null;
      const liveEleveFilter = activeAnneeId ? { anneeScolaireId: activeAnneeId } : {};
      const liveEleveIds = activeAnneeId
        ? (await this.readEleveModel.find(liveEleveFilter, { source_id: 1 }).lean().exec()).map((e: any) => e.source_id)
        : null;
      [elevesCount, notesCount] = await Promise.all([
        this.readEleveModel.countDocuments(liveEleveFilter).exec(),
        liveEleveIds !== null
          ? this.readNoteModel.countDocuments({ eleve_id: { $in: liveEleveIds } }).exec()
          : this.readNoteModel.countDocuments().exec(),
      ]);
    }

    const eleveFilter = resolvedId ? { anneeScolaireId: resolvedId } : (anneeActive ? { anneeScolaireId: anneeActive.id?.toString() ?? anneeActive._id?.toString() } : {});
    const [classesTotal, matieresCount, recentEleves, elevesTotal, elevesInscrits] = await Promise.all([
      this.readClasseModel.countDocuments(classeFilter).exec(),
      this.readMatiereModel.countDocuments(resolvedId ? { anneeScolaireId: resolvedId } : {}).exec(),
      this.readEleveModel.find(eleveFilter).sort({ _id: -1 }).limit(5).exec(),
      // En mode archive : compter les read_eleves de l'année archivée
      // En mode live : compter tous les élèves non partis
      anneeId
        ? this.readEleveModel.countDocuments({ anneeScolaireId: resolvedId }).exec()
        : this.eleveModel.countDocuments({ statut: { $ne: 'parti' } }).exec(),
      anneeId
        ? this.readEleveModel.countDocuments({ anneeScolaireId: resolvedId }).exec()
        : this.eleveModel.countDocuments({ inscriptions: { $elemMatch: { status: 'active' } } }).exec(),
    ]);

    // Convocations enrichies (mode live seulement)
    let convocationsEnrichies: any[] = [];
    if (!anneeId && Array.isArray(convocations) && convocations.length > 0) {
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
      stats: { classes: classesTotal, eleves: elevesCount, elevesTotal, elevesInscrits, matieres: matieresCount, notes: notesCount },
      classesWithCount: classes.map(c => c.toJSON()),
      classesTotal,
      classesPagination: { page: classesPage, limit: classesLimit, total: classesTotal, totalPages: Math.ceil(classesTotal / classesLimit) },
      recentEleves: recentEleves.map(e => e.toJSON()),
      anneeActive: anneeActive?.toJSON() || null,
      convocationsRecentes: convocationsEnrichies,
    };
  }

  // ============ CLASSES LIST ============
  async getClassesList(page = 1, limit = 8, search = '', niveau = '', anneeId?: string) {
    const resolvedId = await this.resolveAnneeId(anneeId);
    const filter: any = resolvedId ? { anneeScolaireId: resolvedId } : {};
    if (search) filter.nom = { $regex: search, $options: 'i' };
    if (niveau) filter.niveau = niveau;

    const sallesFilter: any = resolvedId
      ? { salle_type: 'fixe', salle: { $ne: '' }, anneeScolaireId: resolvedId }
      : { salle_type: 'fixe', salle: { $ne: '' } };

    const [items, total, niveauxConfig, distinctNiveaux, sallesFixe] = await Promise.all([
      this.readClasseModel.find(filter).skip((page - 1) * limit).limit(limit).exec(),
      this.readClasseModel.countDocuments(filter).exec(),
      this.niveauModel.find(resolvedId ? { anneeScolaireId: resolvedId } : {}).sort({ ordre: 1 }).exec(),
      this.readClasseModel.distinct('niveau', resolvedId ? { anneeScolaireId: resolvedId } : {}).exec(),
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
  async getClasseEleves(classeId: string, page = 1, limit = 10, search = '', eleveId = '', anneeId?: string) {
    // Chercher la classe en tenant compte de l'année si fournie
    const classeFilter: any = { source_id: classeId };
    if (anneeId) classeFilter.anneeScolaireId = anneeId;
    const classe = await this.readClasseModel.findOne(classeFilter).exec();
    if (!classe) return null;

    // Toujours filtrer les élèves par l'année de la classe
    const filter: any = { classe_id: classeId };
    const resolvedAnneeId = anneeId || (classe as any).anneeScolaireId;
    if (resolvedAnneeId) filter.anneeScolaireId = resolvedAnneeId;
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
  async getElevesList(page = 1, limit = 12, search = '', classeId = '', eleveId = '', anneeId?: string) {
    const resolvedId = await this.resolveAnneeId(anneeId);

    // Quand pas d'année active et pas d'anneeId explicite (transition entre années),
    // on lit depuis eleveModel directement pour voir tous les élèves sans doublons
    const hasAnneeActive = !!(await this.anneeModel.findOne({ statut: 'active' }).exec());
    if (!hasAnneeActive && !anneeId) {
      // ID de la nouvelle année (préparation) pour prioriser les read_eleves récents
      const prepAnnee = await this.anneeModel.findOne({ statut: 'preparation' }).exec();
      const prepId = prepAnnee ? (prepAnnee as any)._id.toString() : null;

      const conditions: any[] = [{ statut: { $ne: 'parti' } }];
      if (eleveId) {
        conditions.push({ _id: eleveId });
      } else {
        // Filtre par classe : chercher dans inscriptions (active ou inactive)
        if (classeId) {
          conditions.push({ inscriptions: { $elemMatch: { classeId } } });
        }
        if (search) {
          const tokens = search.trim().split(/\s+/);
          if (tokens.length >= 2) {
            for (const tok of tokens) {
              conditions.push({ $or: [{ nom: { $regex: tok, $options: 'i' } }, { prenom: { $regex: tok, $options: 'i' } }] });
            }
          } else {
            conditions.push({ $or: [{ nom: { $regex: search, $options: 'i' } }, { prenom: { $regex: search, $options: 'i' } }] });
          }
        }
      }
      const filter = { $and: conditions };
      const skip = (page - 1) * limit;
      const [rawEleves, total] = await Promise.all([
        this.eleveModel.find(filter).sort({ nom: 1, prenom: 1 }).skip(skip).limit(limit).lean().exec(),
        this.eleveModel.countDocuments(filter).exec(),
      ]);

      // Enrichir : prioriser le read_eleve de la nouvelle année si réinscrit, sinon le plus récent
      const sourceIds = rawEleves.map((e: any) => e._id.toString());
      const readEleves = await this.readEleveModel.find({ source_id: { $in: sourceIds } }).lean().exec();
      const reMap = new Map<string, any>();
      for (const re of readEleves as any[]) {
        const existing = reMap.get(re.source_id);
        // Prioriser l'entrée de la nouvelle année (préparation)
        if (!existing || (prepId && re.anneeScolaireId === prepId)) {
          reMap.set(re.source_id, re);
        }
      }

      const eleves = rawEleves.map((e: any) => {
        const re = reMap.get(e._id.toString());
        const inscriptions: any[] = e.inscriptions || [];
        const estInscritNouvelleAnnee = prepId
          ? inscriptions.some(i => i.anneeScolaireId === prepId && i.status === 'active')
          : false;
        return {
          id: e._id.toString(),
          nom: e.nom, prenom: e.prenom, genre: e.genre,
          email: e.email || '', telephone: e.telephone || '',
          statut: e.statut,
          classe_id: re?.classe_id || '',
          classe_nom: re?.classe_nom || '',
          anneeScolaireId: re?.anneeScolaireId || '',
          estInscritNouvelleAnnee,
        };
      });
      return { eleves, total, totalAll: total, page, limit, totalPages: Math.ceil(total / limit) };
    }

    const filter: any = {};
    if (resolvedId) filter.anneeScolaireId = resolvedId;
    if (eleveId) {
      filter.source_id = eleveId;
    } else {
      if (classeId) filter.classe_id = classeId;
      if (search) {
        const tokens = search.trim().split(/\s+/);
        if (tokens.length >= 2) {
          filter.$and = tokens.map(t => ({
            $or: [{ nom: { $regex: t, $options: 'i' } }, { prenom: { $regex: t, $options: 'i' } }],
          }));
        } else {
          filter.$or = [{ nom: { $regex: search, $options: 'i' } }, { prenom: { $regex: search, $options: 'i' } }];
        }
      }
    }

    const [items, total, totalAll] = await Promise.all([
      this.readEleveModel.find(filter).skip((page - 1) * limit).limit(limit).exec(),
      this.readEleveModel.countDocuments(filter).exec(),
      this.readEleveModel.countDocuments(resolvedId ? { anneeScolaireId: resolvedId } : {}).exec(),
    ]);

    return {
      eleves: items.map(e => e.toJSON()),
      total, totalAll, page, limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // ============ MATIERES LIST ============
  async getMatieresList(page = 1, limit = 8, niveau = '', anneeId?: string) {
    const resolvedId = await this.resolveAnneeId(anneeId);
    const filter: any = {};
    if (resolvedId) filter.anneeScolaireId = resolvedId;
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
  async getSallesList(page = 1, limit = 8, type = '', search = '', anneeId?: string) {
    const resolvedId = await this.resolveAnneeId(anneeId);
    const filter: any = {};
    if (resolvedId) filter.anneeScolaireId = resolvedId;
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
  async getPlanningClasses(anneeId?: string) {
    const resolvedId = await this.resolveAnneeId(anneeId);
    const classeFilter = resolvedId ? { anneeScolaireId: resolvedId } : {};
    const [classes, creneaux] = await Promise.all([
      this.readClasseModel.find(classeFilter).exec(),
      this.readCreneauModel.find({}, { classe_id: 1 }).lean().exec(),
    ]);

    const countMap = new Map<string, number>();
    for (const cr of creneaux) {
      const id = (cr as any).classe_id;
      countMap.set(id, (countMap.get(id) || 0) + 1);
    }

    const classesJson = classes.map(c => {
      const cj = c.toJSON() as any;
      cj._creneauxCount = countMap.get(c.source_id) || 0;
      return cj;
    });

    return { classes: classesJson };
  }

  // ============ PLANNING — créneaux d'UNE classe ============
  async getPlanningClasse(classeId: string) {
    const classe = await this.readClasseModel.findOne({ source_id: classeId }).exec();
    if (!classe) return null;

    const classeAnneeId = (classe as any).anneeScolaireId || '';
    const matiereFilter = classeAnneeId ? { anneeScolaireId: classeAnneeId } : {};

    const [creneaux, allMatieres, assignments] = await Promise.all([
      this.readCreneauModel.find({ classe_id: classeId }).exec(),
      this.readMatiereModel.find(matiereFilter).exec(),
      this.assignmentModel.find({ classe_id: classeId }).lean().exec(),
    ]);

    // Récupérer les matières autorisées pour le niveau (scopé à l'année de la classe)
    let allowedMatiereIds: string[] | null = null;
    if (classe.niveau) {
      const niveauFilter: any = { nom: classe.niveau };
      if (classeAnneeId) niveauFilter.anneeScolaireId = classeAnneeId;
      const niveau = await this.niveauModel.findOne(niveauFilter).lean().exec();
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
  async getNotesFilters(anneeId?: string) {
    const resolvedId = await this.resolveAnneeId(anneeId);
    const classeFilter = resolvedId ? { anneeScolaireId: resolvedId } : {};
    const matiereFilter = resolvedId ? { anneeScolaireId: resolvedId } : {};
    const niveauFilter = resolvedId ? { anneeScolaireId: resolvedId } : {};
    const [classes, matieres, niveaux] = await Promise.all([
      this.readClasseModel.find(classeFilter).exec(),
      this.readMatiereModel.find(matiereFilter).exec(),
      this.niveauModel.find(niveauFilter).sort({ ordre: 1, nom: 1 }).lean().exec(),
    ]);
    return {
      classes: classes.map(c => c.toJSON()),
      matieres: matieres.map(m => m.toJSON()),
      niveaux,
    };
  }

  // ============ NOTES PAGE (agrégat legacy — utilisé par les tests E2E) ============
  async getNotesPage() {
    const anneeId = await this.resolveAnneeId();
    const classeFilter = anneeId ? { anneeScolaireId: anneeId } : {};
    const matiereFilter = anneeId ? { anneeScolaireId: anneeId } : {};
    const niveauFilter = anneeId ? { anneeScolaireId: anneeId } : {};

    const classes = await this.readClasseModel.find(classeFilter).exec();
    const classeIds = classes.map(c => c.source_id);
    const [matieres, eleves, notes, niveaux] = await Promise.all([
      this.readMatiereModel.find(matiereFilter).exec(),
      this.readEleveModel.find({ classe_id: { $in: classeIds } }).exec(),
      this.readNoteModel.find().exec(),
      this.niveauModel.find(niveauFilter).sort({ ordre: 1, nom: 1 }).lean().exec(),
    ]);
    return {
      classes: classes.map(c => c.toJSON()),
      matieres: matieres.map(m => m.toJSON()),
      eleves: eleves.map(e => e.toJSON()),
      notes: notes.map(n => n.toJSON()),
      niveaux,
    };
  }

  // ============ NOTES PAGE — élèves + notes pour une classe/matière/trimestre ============
  async getNotesEleves(classeId: string, matiereId: string, trimestre: number, anneeId?: string) {
    const eleveFilter: any = { classe_id: classeId };
    const noteFilter: any = { matiere_id: matiereId, trimestre };
    if (anneeId) {
      noteFilter.anneeScolaireId = anneeId;
      eleveFilter.anneeScolaireId = anneeId;
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

  // ============ BULLETIN ============
  async getBulletin(eleveId: string, trimestre: number, anneeId?: string) {
    const resolvedId = await this.resolveAnneeId(anneeId);
    const eleveFilter: any = { source_id: eleveId };
    if (resolvedId) eleveFilter.anneeScolaireId = resolvedId;

    const eleve = await this.readEleveModel.findOne(eleveFilter).exec();
    if (!eleve) return null;

    const noteFilter: any = { eleve_id: eleveId, trimestre };
    if (resolvedId) noteFilter.anneeScolaireId = resolvedId;

    const [classe, notes, matieres] = await Promise.all([
      this.readClasseModel.findOne({ source_id: eleve.classe_id }).exec(),
      this.readNoteModel.find(noteFilter).exec(),
      this.readMatiereModel.find().exec(),
    ]);

    const matiereMap = new Map(matieres.map(m => [m.source_id, m.toJSON() as any]));
    const niveau = (classe?.toJSON() as any)?.niveau;

    const notesByMatiere = new Map<string, { ds: number | null; evaluation: number | null; matiere_nom: string; matiere_code: string }>();
    for (const n of notes) {
      const nj = n.toJSON() as any;
      if (!notesByMatiere.has(nj.matiere_id)) {
        notesByMatiere.set(nj.matiere_id, { ds: null, evaluation: null, matiere_nom: nj.matiere_nom, matiere_code: nj.matiere_code });
      }
      const entry = notesByMatiere.get(nj.matiere_id)!;
      if (nj.type === 'ds') entry.ds = nj.valeur;
      else if (nj.type === 'evaluation') entry.evaluation = nj.valeur;
    }

    const bulletin = Array.from(notesByMatiere).map(([mid, data]) => {
      const mat = matiereMap.get(mid);
      const coefficients: Array<{ niveau: string; coefficient: number }> = mat?.coefficients || [];
      let coeff = mat?.coefficient ?? 1;
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
  /** @param anneeScolaireId ID de l'AnneeScolaire (nouvelle API normalisée) */
  async getPeriodes(anneeScolaireId: string) {
    const periodes = await this.periodeModel.find({ anneeScolaireId }).sort({ trimestre: 1, type: 1 }).exec();
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
    classeId?: string, matiereId?: string, trimestre?: number, statut?: string, page = 1, limit = 10, anneeId?: string
  ) {
    const resolvedId = await this.resolveAnneeId(anneeId);
    const filter: any = {};
    if (resolvedId) filter.anneeScolaireId = resolvedId;
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
    // Filtrer par ID normalisé (avec fallback sur label pour données non migrées)
    const classes = await this.readClasseModel.find({
      $or: [
        { anneeScolaireId: anneeId },
        { annee_scolaire: annee.label },
      ],
    }).exec();
    const sids = classes.map(c => c.source_id);
    const [eleves, creneaux, matieres] = await Promise.all([
      this.readEleveModel.find({ anneeScolaireId: anneeId }).exec(),
      this.readCreneauModel.find({ classe_id: { $in: sids } }).exec(),
      this.readMatiereModel.find().exec(),
    ]);
    const eids = eleves.map(e => e.source_id);
    const notes = await this.readNoteModel.find({
      $or: [
        { anneeScolaireId: anneeId },
        { eleve_id: { $in: eids } },
      ],
    }).exec();
    return {
      annee: annee.toJSON(), classes: classes.map(c => c.toJSON()), eleves: eleves.map(e => e.toJSON()),
      notes: notes.map(n => n.toJSON()), creneaux: creneaux.map(c => c.toJSON()), matieres: matieres.map(m => m.toJSON()),
    };
  }

  // ============ PROFESSEURS ============
  async getProfesseursList(page = 1, limit = 20, search = '', anneeId?: string) {
    const filter: any = { statut: { $ne: 'inactif' } };
    if (search) {
      filter.$or = [
        { nom: { $regex: search, $options: 'i' } },
        { prenom: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    // En mode archive (anneeId explicite) : restreindre aux professeurs ayant au moins
    // une affectation dans une classe de cette année.
    if (anneeId) {
      const classeIds = (await this.readClasseModel.find({ anneeScolaireId: anneeId }, { source_id: 1 }).lean().exec())
        .map((c: any) => c.source_id);
      const profIds = await this.assignmentModel.distinct('professeur_id', { classe_id: { $in: classeIds } }).exec();
      filter._id = { $in: profIds };
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

  async getProfesseurDetail(id: string, anneeId?: string) {
    const prof = await this.professeurModel.findById(id).exec();
    if (!prof) return null;
    const resolvedId = await this.resolveAnneeId(anneeId);

    const allAssignments = await this.assignmentModel.find({ professeur_id: id }).lean().exec();

    // Charger les classes référencées pour connaître leur année
    const classeIds = [...new Set(allAssignments.map((a: any) => a.classe_id))];
    const classes = await this.readClasseModel.find({ source_id: { $in: classeIds } }).lean().exec();
    const classeMap = new Map((classes as any[]).map((c: any) => [c.source_id, c]));

    // Ne garder que les affectations dont la classe appartient à l'année résolue
    const assignments = resolvedId
      ? allAssignments.filter((a: any) => (classeMap.get(a.classe_id) as any)?.anneeScolaireId === resolvedId)
      : allAssignments;

    const matiereIds = [...new Set(assignments.map((a: any) => a.matiere_id))];
    const matieres = await this.readMatiereModel.find({ source_id: { $in: matiereIds } }).lean().exec();
    const matiereMap = new Map((matieres as any[]).map((m: any) => [m.source_id, { nom: m.nom, couleur: m.couleur }]));

    const assignmentsEnriched = assignments.map((a: any) => ({
      ...a,
      id: a._id.toString(),
      classe_nom: (classeMap.get(a.classe_id) as any)?.nom || a.classe_id,
      matiere_nom: matiereMap.get(a.matiere_id)?.nom || a.matiere_id,
      matiere_couleur: matiereMap.get(a.matiere_id)?.couleur || '#64748b',
    }));

    return { professeur: (prof as any).toJSON(), assignments: assignmentsEnriched };
  }

  private readonly NIVEAUX_ORDRE = ['CP','CE1','CE2','CM1','CM2','6ème','5ème','4ème','3ème','2nde','1ère','Terminale'];

  private async buildSuggestionForEleve(eleve: any): Promise<{
    derniereClasseId: string | null;
    derniereClasseNom: string | null;
    derniereClasseNiveau: string | null;
    moyenneGenerale: number | null;
    niveauSuggere: string | null;
    promeu: boolean;
    diplome: boolean;
  }> {
    const eleveId = eleve._id.toString();
    const inscriptions: any[] = eleve.inscriptions || [];
    const derniere = inscriptions.length > 0
      ? inscriptions.reduce((max: any, i: any) => i.ordre > max.ordre ? i : max, inscriptions[0])
      : null;

    const derniereClasse = derniere?.classeId
      ? await this.readClasseModel.findOne({ source_id: derniere.classeId }).lean().exec()
      : null;
    const derniereClasseNiveau: string | null = (derniereClasse as any)?.niveau || null;

    const notes = await this.readNoteModel.find({ eleve_id: eleveId }).lean().exec();
    let moyenneGenerale: number | null = null;
    if (notes.length > 0) {
      const sum = (notes as any[]).reduce((acc, n) => acc + (n.valeur ?? 0), 0);
      moyenneGenerale = Math.round((sum / notes.length) * 10) / 10;
    }

    let niveauSuggere: string | null = derniereClasseNiveau;
    let promeu = false;
    let diplome = false;
    if (derniereClasseNiveau && moyenneGenerale !== null) {
      const idx = this.NIVEAUX_ORDRE.indexOf(derniereClasseNiveau);
      const estDernierNiveau = idx === this.NIVEAUX_ORDRE.length - 1; // Terminale
      if (estDernierNiveau && moyenneGenerale >= 10) {
        // Diplômé — pas de niveau suivant
        diplome = true;
        niveauSuggere = null;
        promeu = false;
      } else if (!estDernierNiveau && moyenneGenerale >= 10 && idx !== -1) {
        niveauSuggere = this.NIVEAUX_ORDRE[idx + 1];
        promeu = true;
      }
    }

    return {
      derniereClasseId: derniere?.classeId || null,
      derniereClasseNom: (derniereClasse as any)?.nom || null,
      derniereClasseNiveau,
      moyenneGenerale,
      niveauSuggere,
      promeu,
      diplome,
    };
  }

  async getSuggestionReinscription(eleveId: string): Promise<any> {
    const eleve = await this.eleveModel.findById(eleveId).lean().exec();
    if (!eleve) return null;
    const suggestion = await this.buildSuggestionForEleve(eleve);
    return { id: eleveId, ...suggestion };
  }

  async elevesSansClasse(page = 1, limit = 12, search = ''): Promise<any> {
    // Tous les élèves actifs sans inscription active (peu importe l'année)
    const sansClasseCondition = { $or: [
      { inscriptions: { $exists: false } },
      { inscriptions: { $size: 0 } },
      { inscriptions: { $not: { $elemMatch: { status: 'active' } } } },
    ]};

    const conditions: any[] = [sansClasseCondition, { statut: { $ne: 'parti' } }];

    if (search) {
      const tokens = search.trim().split(/\s+/);
      if (tokens.length >= 2) {
        for (const tok of tokens) {
          conditions.push({ $or: [{ nom: { $regex: tok, $options: 'i' } }, { prenom: { $regex: tok, $options: 'i' } }] });
        }
      } else {
        conditions.push({ $or: [{ nom: { $regex: search, $options: 'i' } }, { prenom: { $regex: search, $options: 'i' } }] });
      }
    }

    const filter = { $and: conditions };
    const skip = (page - 1) * limit;
    const [eleves, total] = await Promise.all([
      this.eleveModel.find(filter).sort({ nom: 1, prenom: 1 }).skip(skip).limit(limit).lean().exec(),
      this.eleveModel.countDocuments(filter).exec(),
    ]);

    // Calculer suggestion pour chaque élève en parallèle
    const suggestions = await Promise.all(eleves.map(e => this.buildSuggestionForEleve(e)));

    return {
      eleves: eleves.map((e: any, idx: number) => {
        const s = suggestions[idx];
        return {
          id: (e as any)._id.toString(),
          nom: e.nom,
          prenom: e.prenom,
          genre: e.genre,
          email: e.email || '',
          telephone: e.telephone || '',
          statut: e.statut,
          classe_id: '',
          classe_nom: '',
          inscriptions: (e as any).inscriptions || [],
          ...s,
        };
      }),
      total,
      totalAll: total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async elevesNonReinscrits(): Promise<any[]> {
    const anneePrep = await this.anneeModel.findOne({ statut: 'preparation' }).exec();
    if (!anneePrep) return [];
    const anneePreparationId = (anneePrep as any)._id.toString();

    // Tous les élèves actifs n'ayant aucune inscription pour l'année en préparation
    const eleves = await this.eleveModel.find({
      statut: 'actif',
      inscriptions: { $not: { $elemMatch: { anneeScolaireId: anneePreparationId } } },
    }).lean().exec();

    return eleves.map(e => {
      const inscriptions: any[] = (e as any).inscriptions || [];
      const derniere = inscriptions.sort((a, b) => b.ordre - a.ordre)[0] || null;
      return {
        id: (e as any)._id.toString(),
        nom: e.nom,
        prenom: e.prenom,
        genre: e.genre,
        date_naissance: e.date_naissance,
        statut: (e as any).statut,
        dernierClasseId: derniere?.classeId || null,
        derniereAnneeScolaireId: derniere?.anneeScolaireId || null,
      };
    });
  }

  async getCreateClasseData() { return { salles: (await this.readSalleModel.find().exec()).map(s => s.toJSON()) }; }
  // ============ NIVEAUX (léger) ============
  async getNiveaux(anneeId?: string) {
    const resolvedId = await this.resolveAnneeId(anneeId);
    const classeFilter = resolvedId ? { anneeScolaireId: resolvedId } : {};
    const niveauFilter = resolvedId ? { anneeScolaireId: resolvedId } : {};
    const [niveauxConfig, classes] = await Promise.all([
      this.niveauModel.find(niveauFilter).sort({ ordre: 1, nom: 1 }).lean().exec(),
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
  async getClassesParNiveau(niveau: string, dateNaissance?: string, anneeId?: string) {
    const resolvedId = await this.resolveAnneeId(anneeId);
    const filter: any = { niveau };
    if (resolvedId) filter.anneeScolaireId = resolvedId;
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
  async getEleveFiche(eleveId: string, anneeId?: string) {
    const resolvedId = await this.resolveAnneeId(anneeId);
    // Chercher d'abord avec filtre année, puis fallback sans filtre (élève sans inscription)
    let eleve = resolvedId
      ? await this.readEleveModel.findOne({ source_id: eleveId, anneeScolaireId: resolvedId }).exec()
      : null;
    if (!eleve) {
      eleve = await this.readEleveModel.findOne({ source_id: eleveId }).exec();
    }
    if (!eleve) return null;

    const [classe, creneauxClasse] = await Promise.all([
      this.readClasseModel.findOne({ source_id: eleve.classe_id }).exec(),
      this.readCreneauModel.find({ classe_id: eleve.classe_id }).exec(),
    ]);

    // Salle actuelle : fixe → salle de la classe, variable → laisser vide (résolu côté front via planning)
    const salleActuelle = classe?.salle_type === 'fixe' ? classe.salle : null;

    return {
      eleve: eleve.toJSON(),
      classe: classe?.toJSON() || null,
      salleActuelle,
      creneaux: creneauxClasse.map(c => c.toJSON()),
      anneeActive: (eleve as any).annee_scolaire || null,
      anneeActiveId: (eleve as any).anneeScolaireId || null,
    };
  }
}
