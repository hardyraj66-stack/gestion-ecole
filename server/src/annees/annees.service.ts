import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AnneeScolaire, AnneeStatut } from './annee.schema';
import { Classe } from '../classes/classe.schema';
import { Eleve } from '../eleves/eleve.schema';
import { Matiere } from '../matieres/matiere.schema';
import { Note } from '../notes/note.schema';
import { Creneau } from '../planning/creneau.schema';
import { TeacherAssignment } from '../teacher-assignments/teacher-assignment.schema';
import { Niveau } from '../niveaux/niveau.schema';
import { Salle } from '../salles/salle.schema';
import { PeriodesService } from '../periodes/periodes.service';
import { ViewBuilderService } from '../read/view-builder.service';

@Injectable()
export class AnneesService {
  constructor(
    @InjectModel(AnneeScolaire.name) private model: Model<AnneeScolaire>,
    @InjectModel(Classe.name) private classeModel: Model<Classe>,
    @InjectModel(Eleve.name) private eleveModel: Model<Eleve>,
    @InjectModel(Matiere.name) private matiereModel: Model<Matiere>,
    @InjectModel(Note.name) private noteModel: Model<Note>,
    @InjectModel(Creneau.name) private creneauModel: Model<Creneau>,
    @InjectModel(TeacherAssignment.name) private assignmentModel: Model<TeacherAssignment>,
    @InjectModel(Niveau.name) private niveauModel: Model<Niveau>,
    @InjectModel(Salle.name) private salleModel: Model<Salle>,
    private readonly periodesService: PeriodesService,
    private readonly viewBuilder: ViewBuilderService,
  ) {}

  findAll() {
    return this.model.find().sort({ debut_planifie: -1 }).exec();
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

  async create(data: { label?: string; debut_planifie?: string | null; fin_planifie?: string | null; debut?: string; fin?: string }) {
    const year = new Date().getFullYear();
    const label = data.label || `${year} - ${year + 1}`;

    const existing = await this.model.findOne({ label }).exec();
    if (existing) {
      throw new BadRequestException(`L'année scolaire "${label}" existe déjà`);
    }

    const debutPlanifie = data.debut_planifie ?? data.debut ?? null;
    const finPlanifie   = data.fin_planifie   ?? data.fin   ?? null;

    if (debutPlanifie && finPlanifie && debutPlanifie >= finPlanifie) {
      throw new BadRequestException('La date de début doit être antérieure à la date de fin');
    }

    const annee = new this.model({
      label,
      debut_planifie: debutPlanifie,
      fin_planifie:   finPlanifie,
      debut_reel:     null,
      fin_reel:       null,
      migration_effectuee: false,
      statut: 'preparation',
      historique: [{
        action: 'creation',
        date: new Date().toISOString(),
        details: `Année scolaire "${label}" créée en préparation`,
      }],
    });

    return annee.save();
  }

  async update(id: string, data: Partial<{ label: string; debut_planifie: string | null; fin_planifie: string | null }>) {
    const annee = await this.model.findById(id).exec();
    if (!annee) return null;

    if (annee.statut === 'terminee') {
      throw new BadRequestException('Impossible de modifier une année scolaire terminée');
    }

    if (annee.statut === 'active' && data.debut_planifie !== undefined) {
      throw new BadRequestException("Impossible de modifier la date de début d'une année scolaire active");
    }

    const newDebut = data.debut_planifie !== undefined ? data.debut_planifie : annee.debut_planifie;
    const newFin   = data.fin_planifie   !== undefined ? data.fin_planifie   : annee.fin_planifie;
    if (newDebut && newFin && newDebut >= newFin) {
      throw new BadRequestException('La date de début doit être antérieure à la date de fin');
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

    const today = new Date().toISOString().slice(0, 10);
    annee.debut_reel = today;
    annee.statut = 'active';
    annee.historique.push({
      action: 'demarrage',
      date: new Date().toISOString(),
      details: `Démarrage réel : ${today} (planifié : ${annee.debut_planifie ?? 'non défini'})`,
    });

    await annee.save();
    return annee;
  }

  async terminer(id: string): Promise<AnneeScolaire> {
    const annee = await this.model.findById(id).exec();
    if (!annee) throw new BadRequestException('Année scolaire introuvable');

    if (annee.statut !== 'active') {
      throw new BadRequestException(
        `Impossible de terminer : l'année est en statut "${annee.statut}". Seule l'année active peut être terminée.`
      );
    }

    const anneeId = (annee as any)._id.toString();
    const today = new Date().toISOString().slice(0, 10);
    const anticipee = annee.fin_planifie != null && today < annee.fin_planifie;
    const now = new Date().toISOString();

    // Action 1 — Clôturer
    annee.fin_reel = today;
    annee.statut = 'terminee';
    annee.historique.push({
      action: anticipee ? 'cloture_anticipee' : 'cloture',
      date: now,
      details: `Clôture réelle : ${today} (planifiée : ${annee.fin_planifie ?? 'non définie'})`,
    });
    await annee.save();

    // Action 2 — Créer la nouvelle année
    const parts = annee.label.split('-').map((s: string) => s.trim());
    const startYear = parseInt(parts[parts.length - 1], 10) || new Date().getFullYear();
    const newLabel = `${startYear + 1}-${startYear + 2}`;
    let nouvelleAnnee = await this.model.findOne({ label: newLabel }).exec();
    if (!nouvelleAnnee) {
      nouvelleAnnee = await this.model.create({
        label: newLabel,
        statut: 'preparation',
        debut_planifie: null,
        fin_planifie: null,
        debut_reel: null,
        fin_reel: null,
        migration_effectuee: false,
        historique: [{ action: 'creation', date: now, details: `Créée automatiquement à la clôture de ${annee.label}` }],
      });
    }
    const nouvelleId = (nouvelleAnnee as any)._id.toString();

    // Action 2bis — Copier Matières, puis Niveaux (avec remapping matiere_ids), puis Salles
    // Matières d'abord car Niveau.matiere_ids les référence par ID
    const matiereIdMap = new Map<string, string>(); // ancienId -> nouveauId
    if (await this.matiereModel.countDocuments({ anneeScolaireId: nouvelleId }).exec() === 0) {
      const matieresAnc = await this.matiereModel.find({ anneeScolaireId: anneeId, actif: { $ne: false } }).lean().exec();
      for (const m of matieresAnc) {
        const nouvelle = await this.matiereModel.create({
          nom: (m as any).nom, code: (m as any).code,
          coefficient: (m as any).coefficient ?? 1,
          coefficients: (m as any).coefficients || [],
          description: (m as any).description || '',
          couleur: (m as any).couleur || '',
          actif: true,
          anneeScolaireId: nouvelleId,
        });
        matiereIdMap.set((m as any)._id.toString(), (nouvelle as any)._id.toString());
      }
    }

    // Niveaux : remapper matiere_ids vers les nouveaux IDs de matières
    if (await this.niveauModel.countDocuments({ anneeScolaireId: nouvelleId }).exec() === 0) {
      const niveauxAnc = await this.niveauModel.find({ anneeScolaireId: anneeId }).lean().exec();
      for (const n of niveauxAnc) {
        const ancMatiereIds: string[] = (n as any).matiere_ids || [];
        const newMatiereIds = ancMatiereIds
          .map(id => matiereIdMap.get(id))
          .filter((id): id is string => !!id);
        await this.niveauModel.create({
          nom: (n as any).nom, ordre: (n as any).ordre,
          description: (n as any).description || '',
          matiere_ids: newMatiereIds,
          anneeScolaireId: nouvelleId,
        });
      }
    }

    // Salles
    if (await this.salleModel.countDocuments({ anneeScolaireId: nouvelleId }).exec() === 0) {
      const sallesAnc = await this.salleModel.find({ anneeScolaireId: anneeId, actif: { $ne: false } }).lean().exec();
      for (const s of sallesAnc) {
        await this.salleModel.create({
          nom: (s as any).nom, capacite: (s as any).capacite,
          description: (s as any).description || '',
          type: (s as any).type,
          equipements: (s as any).equipements || [],
          accessible_pmr: (s as any).accessible_pmr || false,
          batiment: (s as any).batiment || '',
          etage: (s as any).etage || '',
          actif: true,
          anneeScolaireId: nouvelleId,
        });
      }
    }

    // Action 3 — Copier les classes
    const classesAnc = await this.classeModel.find({ anneeScolaireId: anneeId, actif: { $ne: false } }).lean().exec();
    const mapping = new Map<string, string>();

    for (const cl of classesAnc) {
      const ancId = (cl as any)._id.toString();
      const existe = await this.classeModel.findOne({ anneeScolaireId: nouvelleId, nom: (cl as any).nom }).lean().exec();
      if (!existe) {
        const nouvelleClasse = await this.classeModel.create({
          nom: (cl as any).nom,
          niveau: (cl as any).niveau,
          capacite: (cl as any).capacite,
          salle: (cl as any).salle,
          salle_type: (cl as any).salle_type,
          annee_scolaire: newLabel,
          anneeScolaireId: nouvelleId,
        });
        mapping.set(ancId, (nouvelleClasse as any)._id.toString());
      } else {
        mapping.set(ancId, (existe as any)._id.toString());
      }
    }

    // Action 4 — Migrer les teacher-assignments
    const assignments = await this.assignmentModel.find({
      classe_id: { $in: Array.from(mapping.keys()) },
    }).lean().exec();

    const assignOps: any[] = [];
    for (const a of assignments) {
      const nouveauClasseId = mapping.get((a as any).classe_id);
      if (!nouveauClasseId) continue;
      const existe = await this.assignmentModel.findOne({
        classe_id: nouveauClasseId,
        matiere_id: (a as any).matiere_id,
      }).lean().exec();
      if (!existe) {
        assignOps.push({
          insertOne: {
            document: {
              professeur_id: (a as any).professeur_id,
              classe_id: nouveauClasseId,
              matiere_id: (a as any).matiere_id,
            },
          },
        });
      }
    }
    if (assignOps.length > 0) await this.assignmentModel.bulkWrite(assignOps);

    // Action 5 — Migrer le planning
    const creneaux = await this.creneauModel.find({
      classe_id: { $in: Array.from(mapping.keys()) },
    }).lean().exec();

    const creneauOps: any[] = [];
    for (const cr of creneaux) {
      const nouveauClasseId = mapping.get((cr as any).classe_id);
      if (!nouveauClasseId) continue;
      creneauOps.push({
        insertOne: {
          document: {
            classe_id: nouveauClasseId,
            matiere_id: (cr as any).matiere_id,
            matiere_nom: (cr as any).matiere_nom,
            matiere_couleur: (cr as any).matiere_couleur,
            jour: (cr as any).jour,
            heure_debut: (cr as any).heure_debut,
            heure_fin: (cr as any).heure_fin,
            salle: (cr as any).salle,
          },
        },
      });
    }
    if (creneauOps.length > 0) await this.creneauModel.bulkWrite(creneauOps);

    // Action 6 — Passer toutes les inscriptions active → inactive
    await this.eleveModel.updateMany(
      { 'inscriptions.status': 'active' },
      { $set: { 'inscriptions.$[elem].status': 'inactive' } },
      { arrayFilters: [{ 'elem.status': 'active' }] } as any,
    );

    // Action 7 — Initialiser les périodes
    await this.periodesService.initForAnnee(nouvelleId, (nouvelleAnnee as any).debut_planifie ?? undefined);

    annee.historique.push({
      action: 'migration',
      date: now,
      details: `Nouvelle année "${newLabel}" créée — ${classesAnc.length} classes copiées, planning migré, inscriptions archivées`,
    });
    await annee.save();

    // Action 8 — Reconstruire tous les read models (classes, élèves, créneaux, etc.)
    await this.viewBuilder.rebuildAll();

    return annee;
  }

  // ── MIGRATION DES ÉLÈVES (ancienne méthode maintenue) ──────────────────────────────────────────────────

  async migrerEleves(id: string): Promise<{ classes: number; eleves: number }> {
    const annee = await this.model.findById(id).exec();
    if (!annee) throw new BadRequestException('Année scolaire introuvable');

    if (annee.statut !== 'preparation' && annee.statut !== 'active') {
      throw new BadRequestException('La migration des élèves ne peut se faire que sur une année en préparation ou active');
    }

    const anneeId = (annee as any)._id.toString();

    const anneeTerminees = await this.model.find({ statut: 'terminee' }).sort({ fin_reel: -1 }).exec();
    if (anneeTerminees.length === 0) {
      throw new BadRequestException('Aucune année précédente à migrer');
    }
    const anneePrec = anneeTerminees[0];
    const anneeIdPrec = (anneePrec as any)._id.toString();

    const classesNouv = await this.classeModel.find({
      $or: [{ anneeScolaireId: anneeId }, { annee_scolaire: annee.label }],
    }).lean().exec();

    if (classesNouv.length === 0) {
      throw new BadRequestException("Aucune classe trouvée dans la nouvelle année. Démarrez d'abord l'année.");
    }

    const classesPrec = await this.classeModel.find({
      $or: [{ anneeScolaireId: anneeIdPrec }, { annee_scolaire: anneePrec.label }],
    }).lean().exec();

    const classesPrecIds = classesPrec.map((c: any) => c._id.toString());
    const nouvParNom = new Map(classesNouv.map((c: any) => [c.nom as string, c]));

    // Élèves avec inscription active dans l'ancienne année
    const eleves = await this.eleveModel.find({
      inscriptions: { $elemMatch: { anneeScolaireId: anneeIdPrec, status: 'active' } },
      statut: 'actif',
    }).lean().exec();

    const ops: any[] = [];
    for (const e of eleves) {
      const inscriptions: any[] = (e as any).inscriptions || [];
      const inscriptionActive = inscriptions.find((i: any) => i.status === 'active' && i.anneeScolaireId === anneeIdPrec);
      if (!inscriptionActive) continue;

      const classePrec = classesPrec.find((c: any) => c._id.toString() === inscriptionActive.classeId);
      const nouvelleClasse = classePrec ? nouvParNom.get((classePrec as any).nom) : undefined;
      if (!nouvelleClasse) continue;

      const nouveauClasseId = (nouvelleClasse as any)._id.toString();
      const dejaInscritNouvelleAnnee = inscriptions.some((i: any) => i.anneeScolaireId === anneeId);

      ops.push({
        updateOne: {
          filter: { _id: (e as any)._id },
          update: dejaInscritNouvelleAnnee
            ? { $set: { classe_id: nouveauClasseId } }
            : {
                $set: {
                  classe_id: nouveauClasseId,
                  inscrit_annee_id: anneeId,
                  statut_inscription: 'inscrit',
                  'inscriptions.$[elem].status': 'inactive',
                },
                $push: {
                  inscriptions: {
                    classeId: nouveauClasseId,
                    status: 'active',
                    anneeScolaireId: anneeId,
                    ordre: inscriptions.length + 1,
                  },
                },
              },
          ...(dejaInscritNouvelleAnnee ? {} : { arrayFilters: [{ 'elem.anneeScolaireId': anneeIdPrec }] }),
        },
      });
    }

    if (ops.length > 0) await this.eleveModel.bulkWrite(ops);

    annee.historique.push({
      action: 'migration',
      date: new Date().toISOString(),
      details: `Migration élèves : ${ops.length} élèves migrés dans "${annee.label}" depuis "${anneePrec.label}"`,
    });
    await annee.save();

    return { classes: classesNouv.length, eleves: ops.length };
  }

  // ── SNAPSHOT d'une année ──────────────────────────────────────────────────

  async getSnapshot(id: string) {
    const annee = await this.model.findById(id).exec();
    if (!annee) return null;

    const anneeId = (annee as any)._id.toString();
    const classes = await this.classeModel.find({
      $or: [
        { anneeScolaireId: anneeId },
        { annee_scolaire: annee.label },
      ],
    }).exec();
    const classeIds = classes.map(c => (c as any)._id.toString());

    // Utiliser les inscriptions pour trouver les élèves de cette année
    const eleves = await this.eleveModel.find({
      inscriptions: { $elemMatch: { anneeScolaireId: anneeId } },
    }).exec();
    const eleveIds = eleves.map(e => (e as any)._id.toString());

    const notes    = await this.noteModel.find({ eleve_id: { $in: eleveIds } }).exec();
    const creneaux = await this.creneauModel.find({ classe_id: { $in: classeIds } }).exec();
    const matieres = await this.matiereModel.find().exec();

    return { annee, classes, eleves, notes, creneaux, matieres };
  }
}
