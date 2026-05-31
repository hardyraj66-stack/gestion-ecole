import { Injectable, BadRequestException, InternalServerErrorException } from '@nestjs/common';
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

    // Rétrocompatibilité : accepte aussi debut/fin (ancien format)
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

    // Valider cohérence des dates si les deux sont présentes
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
    const anneeId = (annee as any)._id.toString();

    // Cloner classes + planning depuis l'année terminée si pas encore fait
    const classesExistantes = await this.classeModel.countDocuments({
      $or: [{ anneeScolaireId: anneeId }, { annee_scolaire: annee.label }],
    });
    if (classesExistantes === 0) {
      const anneeTerminees = await this.model.find({ statut: 'terminee' }).sort({ fin_reel: -1 }).exec();
      if (anneeTerminees.length > 0) {
        const anneePrec = anneeTerminees[0];
        const anneeIdPrec = (anneePrec as any)._id.toString();
        const classesAnc = await this.classeModel.find({
          $or: [{ anneeScolaireId: anneeIdPrec }, { annee_scolaire: anneePrec.label }],
        }).lean().exec();

        const classeMap = new Map<string, string>();
        for (const cl of classesAnc) {
          const ancId = (cl as any)._id.toString();
          const newClasse = await this.classeModel.create({
            nom: (cl as any).nom, niveau: (cl as any).niveau,
            capacite: (cl as any).capacite, salle: (cl as any).salle,
            salle_type: (cl as any).salle_type,
            annee_scolaire: annee.label, anneeScolaireId: anneeId,
          });
          classeMap.set(ancId, (newClasse as any)._id.toString());
        }

        // Cloner le planning
        const creneauxAnc = await this.creneauModel.find({
          classe_id: { $in: Array.from(classeMap.keys()) },
        }).lean().exec();
        if (creneauxAnc.length > 0) {
          await this.creneauModel.insertMany(creneauxAnc.map((cr: any) => ({
            classe_id: classeMap.get(cr.classe_id.toString()) ?? cr.classe_id,
            matiere_id: cr.matiere_id, matiere_nom: cr.matiere_nom,
            matiere_couleur: cr.matiere_couleur, jour: cr.jour,
            heure_debut: cr.heure_debut, heure_fin: cr.heure_fin, salle: cr.salle,
          })));
        }

        // Marquer migration effectuée pour ne pas re-cloner via le bouton manuel
        annee.migration_effectuee = true;
        await annee.save();
      }
    }

    // initForAnnee prend startDate optionnel
    await this.periodesService.initForAnnee(anneeId, annee.debut_planifie ?? undefined);

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

    const today = new Date().toISOString().slice(0, 10);
    const anticipee = annee.fin_planifie != null && today < annee.fin_planifie;

    annee.fin_reel = today;
    annee.statut = 'terminee';
    annee.historique.push({
      action: anticipee ? 'cloture_anticipee' : 'cloture',
      date: new Date().toISOString(),
      details: `Clôture réelle : ${today} (planifiée : ${annee.fin_planifie ?? 'non définie'})`,
    });
    await annee.save();

    return annee;
  }

  // ── MIGRATION DES ÉLÈVES ──────────────────────────────────────────────────

  async migrerEleves(id: string): Promise<{ classes: number; eleves: number }> {
    const annee = await this.model.findById(id).exec();
    if (!annee) throw new BadRequestException('Année scolaire introuvable');

    if (annee.statut !== 'preparation' && annee.statut !== 'active') {
      throw new BadRequestException('La migration des élèves ne peut se faire que sur une année en préparation ou active');
    }

    const anneeId = (annee as any)._id.toString();

    // Trouver l'année terminée la plus récente
    const anneeTerminees = await this.model.find({ statut: 'terminee' }).sort({ fin_reel: -1 }).exec();
    if (anneeTerminees.length === 0) {
      throw new BadRequestException('Aucune année précédente à migrer');
    }
    const anneePrec = anneeTerminees[0];
    const anneeIdPrec = (anneePrec as any)._id.toString();

    // Classes de la nouvelle année
    const classesNouv = await this.classeModel.find({
      $or: [{ anneeScolaireId: anneeId }, { annee_scolaire: annee.label }],
    }).lean().exec();

    if (classesNouv.length === 0) {
      throw new BadRequestException("Aucune classe trouvée dans la nouvelle année. Démarrez d'abord l'année.");
    }

    // Classes de l'ancienne année
    const classesPrec = await this.classeModel.find({
      $or: [{ anneeScolaireId: anneeIdPrec }, { annee_scolaire: anneePrec.label }],
    }).lean().exec();

    const classesPrecIds = classesPrec.map((c: any) => c._id.toString());

    // Mapping ancienne classe → nouvelle classe par nom (même nom = même classe restructurée)
    const nouvParNom = new Map(classesNouv.map((c: any) => [c.nom as string, c]));

    // Tous les élèves actifs de l'ancienne année
    const eleves = await this.eleveModel.find({
      classe_id: { $in: classesPrecIds },
      statut: 'actif',
    }).lean().exec();

    const ops: any[] = [];
    for (const e of eleves) {
      const classePrec = classesPrec.find((c: any) => c._id.toString() === (e as any).classe_id);
      const nouvelleClasse = classePrec ? nouvParNom.get((classePrec as any).nom) : undefined;

      if (!nouvelleClasse) continue; // classe supprimée entre les deux années → skip

      const nouveauClasseId = (nouvelleClasse as any)._id.toString();
      const historique = (e as any).historique_classes as any[] || [];
      const dejaPourAnnee = historique.some((h: any) => h.anneeScolaireId === anneeId);

      ops.push({
        updateOne: {
          filter: { _id: (e as any)._id },
          update: {
            $set: {
              classe_id: nouveauClasseId,
              inscrit_annee_id: anneeId,
              statut_inscription: 'inscrit',
            },
            ...(dejaPourAnnee ? {} : {
              $push: {
                historique_classes: {
                  annee_scolaire: annee.label,
                  anneeScolaireId: anneeId,
                  classe_id: nouveauClasseId,
                  classe_nom: (nouvelleClasse as any).nom || '',
                  niveau: (nouvelleClasse as any).niveau || '',
                  statut: 'inscrit',
                },
              },
            }),
          },
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

    const eleves = await this.eleveModel.find({ classe_id: { $in: classeIds } }).exec();
    const eleveIds = eleves.map(e => (e as any)._id.toString());

    const notes    = await this.noteModel.find({ eleve_id: { $in: eleveIds } }).exec();
    const creneaux = await this.creneauModel.find({ classe_id: { $in: classeIds } }).exec();
    const matieres = await this.matiereModel.find().exec();

    return { annee, classes, eleves, notes, creneaux, matieres };
  }
}
