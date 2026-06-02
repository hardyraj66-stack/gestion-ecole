import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Eleve } from '../eleves/eleve.schema';
import { Classe } from '../classes/classe.schema';
import { Absence } from '../suivi/absence.schema';
import { Convocation } from '../suivi/convocation.schema';
import { AnneeScolaire } from '../annees/annee.schema';
import { Niveau } from '../niveaux/niveau.schema';
import { Salle } from '../salles/salle.schema';
import { Matiere } from '../matieres/matiere.schema';

@Injectable()
export class MigrationService implements OnModuleInit {
  private readonly logger = new Logger('Migration');

  constructor(
    @InjectModel(Eleve.name) private eleveModel: Model<Eleve>,
    @InjectModel(Classe.name) private classeModel: Model<Classe>,
    @InjectModel(Absence.name) private absenceModel: Model<Absence>,
    @InjectModel(Convocation.name) private convocationModel: Model<Convocation>,
    @InjectModel(AnneeScolaire.name) private anneeModel: Model<AnneeScolaire>,
    @InjectModel(Niveau.name) private niveauModel: Model<Niveau>,
    @InjectModel(Salle.name) private salleModel: Model<Salle>,
    @InjectModel(Matiere.name) private matiereModel: Model<Matiere>,
  ) {}

  async onModuleInit() {
    await this.migrateVersInscriptions();
    await this.migrateAbsences();
    await this.migrateConvocations();
    await this.migrateHistoriqueClasses();
    await this.migrateAnneeScolaireIds();
    await this.migrateEntitesGlobalesVersAnnee();
  }

  /**
   * Backfill : associe Niveaux/Salles/Matières sans anneeScolaireId à l'année active.
   * Crée aussi les Niveaux manquants (dérivés des classes) si aucun n'existe pour l'année.
   */
  private async migrateEntitesGlobalesVersAnnee() {
    const active = await this.anneeModel.findOne({ statut: 'active' }).exec()
      ?? await this.anneeModel.findOne({ statut: 'preparation' }).exec();
    if (!active) return;
    const anneeId = (active as any)._id.toString();

    let touched = 0;
    for (const [model, label] of [
      [this.salleModel, 'salles'],
      [this.matiereModel, 'matières'],
      [this.niveauModel, 'niveaux'],
    ] as const) {
      const res = await (model as any).updateMany(
        { $or: [{ anneeScolaireId: { $exists: false } }, { anneeScolaireId: '' }, { anneeScolaireId: null }] },
        { $set: { anneeScolaireId: anneeId } },
      ).exec();
      if (res.modifiedCount > 0) {
        touched += res.modifiedCount;
        this.logger.log(`Migration ${label} → année active : ${res.modifiedCount} mis à jour`);
      }
    }

    // Créer les niveaux manquants pour l'année active (dérivés des classes + matières)
    const niveauxExistants = await this.niveauModel.countDocuments({ anneeScolaireId: anneeId }).exec();
    if (niveauxExistants === 0) {
      const classes = await this.classeModel.find({ anneeScolaireId: anneeId }).lean().exec();
      const matieres = await this.matiereModel.find({ anneeScolaireId: anneeId }).lean().exec();
      const ordre = ['CP','CE1','CE2','CM1','CM2','6ème','5ème','4ème','3ème','2nde','1ère','Terminale'];
      const nomsNiveaux = [...new Set(classes.map((c: any) => c.niveau).filter(Boolean))]
        .sort((a, b) => ordre.indexOf(a) - ordre.indexOf(b));
      const docs = nomsNiveaux.map((nom, idx) => {
        const matiereIds = matieres
          .filter((m: any) => (m.coefficients || []).some((c: any) => c.niveau === nom))
          .map((m: any) => m._id.toString());
        return { nom, ordre: idx, description: '', matiere_ids: matiereIds, anneeScolaireId: anneeId };
      });
      if (docs.length > 0) {
        await this.niveauModel.insertMany(docs);
        this.logger.log(`Migration niveaux : ${docs.length} niveaux créés pour l'année active`);
      }
    }

    if (touched === 0 && niveauxExistants > 0) {
      this.logger.log('Migration entités globales → année : rien à migrer');
    }
  }

  private async migrateVersInscriptions() {
    const eleves = await this.eleveModel.find({
      $or: [
        { inscriptions: { $exists: false } },
        { inscriptions: { $size: 0 } },
      ],
      classe_id: { $exists: true, $nin: ['', null] },
    }).lean().exec();

    if (eleves.length === 0) {
      this.logger.log('Migration inscriptions : déjà migrés ou aucun élève à migrer');
      return;
    }

    this.logger.log(`Migration inscriptions : ${eleves.length} élèves à migrer`);
    const classes = await this.classeModel.find().lean().exec();
    const classeMap = new Map(classes.map(c => [c._id.toString(), c]));

    const ops: any[] = [];

    for (const eleve of eleves) {
      const historique: any[] = (eleve as any).historique_classes || [];
      const inscriptions: any[] = [];

      if (historique.length === 0) {
        // Pas d'historique : créer une entrée active depuis classe_id
        const classe = classeMap.get((eleve as any).classe_id);
        const anneeScolaireId = classe ? (classe as any).anneeScolaireId || '' : '';
        inscriptions.push({
          classeId: (eleve as any).classe_id,
          status: 'active',
          anneeScolaireId,
          ordre: 1,
        });
      } else {
        // Trier l'historique par annee_scolaire croissant
        const sorted = [...historique].sort((a, b) =>
          (a.annee_scolaire || '').localeCompare(b.annee_scolaire || '')
        );

        let ordre = 1;
        for (const h of sorted) {
          inscriptions.push({
            classeId: h.classe_id,
            status: 'inactive',
            anneeScolaireId: h.anneeScolaireId || '',
            ordre: ordre++,
          });
        }

        // Vérifier si la dernière entrée correspond au classe_id actuel
        const lastH = sorted[sorted.length - 1];
        const classeIdActuel = (eleve as any).classe_id;

        if (lastH.classe_id === classeIdActuel) {
          // Passer la dernière en active
          inscriptions[inscriptions.length - 1].status = 'active';
        } else {
          // Ajouter une nouvelle entrée active
          const classe = classeMap.get(classeIdActuel);
          const anneeScolaireId = classe ? (classe as any).anneeScolaireId || '' : '';
          inscriptions.push({
            classeId: classeIdActuel,
            status: 'active',
            anneeScolaireId,
            ordre: ordre,
          });
        }
      }

      ops.push({
        updateOne: {
          filter: { _id: (eleve as any)._id },
          update: { $set: { inscriptions } },
        },
      });
    }

    if (ops.length > 0) await this.eleveModel.bulkWrite(ops);
    this.logger.log(`Migration inscriptions : ${ops.length} élèves migrés`);
  }

  // Déduit l'année scolaire depuis une date ISO "YYYY-MM-DD"
  // Règle : mois >= 8 (août) → "year/year+1", sinon → "year-1/year"
  private deduireAnneeScolaire(dateStr: string): string {
    const d = new Date(dateStr);
    const month = d.getMonth() + 1; // 1-indexed
    const year = d.getFullYear();
    if (month >= 8) return `${year}-${year + 1}`;
    return `${year - 1}-${year}`;
  }

  private async migrateAbsences() {
    const sans = await this.absenceModel.find({ annee_scolaire: { $in: ['', null, undefined] } }).lean().exec();
    if (sans.length === 0) return;
    this.logger.log(`Migration absences : ${sans.length} enregistrements sans annee_scolaire`);
    const ops = sans.map(a => ({
      updateOne: {
        filter: { _id: a._id },
        update: { $set: { annee_scolaire: this.deduireAnneeScolaire(a.date) } },
      },
    }));
    await this.absenceModel.bulkWrite(ops);
    this.logger.log(`Migration absences : terminée`);
  }

  private async migrateConvocations() {
    const sans = await this.convocationModel.find({ annee_scolaire: { $in: ['', null, undefined] } }).lean().exec();
    if (sans.length === 0) return;
    this.logger.log(`Migration convocations : ${sans.length} enregistrements sans annee_scolaire`);
    const ops = sans.map(c => ({
      updateOne: {
        filter: { _id: c._id },
        update: { $set: { annee_scolaire: this.deduireAnneeScolaire(c.date) } },
      },
    }));
    await this.convocationModel.bulkWrite(ops);
    this.logger.log(`Migration convocations : terminée`);
  }

  private async migrateHistoriqueClasses() {
    const annees = await this.anneeModel.find({ statut: 'terminee' }).lean().exec();
    if (annees.length === 0) {
      this.logger.log('Migration historique_classes : aucune année terminée trouvée');
      return;
    }

    const classes = await this.classeModel.find().lean().exec();
    const classeMap = new Map(classes.map(c => [c._id.toString(), c]));

    const eleves = await this.eleveModel.find().lean().exec();
    let updated = 0;

    for (const eleve of eleves) {
      const existing = (eleve as any).historique_classes as any[] || [];

      // Construire entrée pour l'année courante via la classe actuelle
      const classeActuelle = classeMap.get(eleve.classe_id);
      if (!classeActuelle) continue;

      const anneeClasse = (classeActuelle as any).annee_scolaire as string | undefined;
      const anneeClasseId = (classeActuelle as any).anneeScolaireId as string | undefined;
      if (!anneeClasse) continue;

      // Vérifier si l'entrée pour cette année existe déjà
      const dejaPresent = existing.some((h: any) => h.annee_scolaire === anneeClasse);
      if (!dejaPresent) {
        await this.eleveModel.updateOne(
          { _id: eleve._id },
          {
            $push: {
              historique_classes: {
                annee_scolaire: anneeClasse,
                anneeScolaireId: anneeClasseId || '',
                classe_id: eleve.classe_id,
                classe_nom: (classeActuelle as any).nom || '',
                niveau: (classeActuelle as any).niveau || '',
                statut: (eleve as any).statut || 'actif',
              },
            },
          },
        );
        updated++;
      }
    }

    this.logger.log(`Migration historique_classes : ${updated} élèves mis à jour`);
  }

  /**
   * Migration automatique au démarrage : remplit anneeScolaireId dans les collections
   * qui n'ont pas encore été migrées (fallback si le script one-shot n'a pas tourné).
   */
  private async migrateAnneeScolaireIds() {
    const annees = await this.anneeModel.find().lean().exec();
    if (annees.length === 0) return;

    const labelToId = new Map<string, string>(
      annees.map((a: any) => [a.label as string, a._id.toString()] as [string, string])
    );

    // Migrer les classes sans anneeScolaireId
    const classesSans = await this.classeModel.find({ anneeScolaireId: { $in: ['', null, undefined] } }).lean().exec();
    if (classesSans.length > 0) {
      this.logger.log(`Migration anneeScolaireId : ${classesSans.length} classe(s) à migrer`);
      const ops = classesSans
        .filter((c: any) => labelToId.has((c as any).annee_scolaire))
        .map((c: any) => ({
          updateOne: {
            filter: { _id: c._id },
            update: { $set: { anneeScolaireId: labelToId.get((c as any).annee_scolaire) } },
          },
        }));
      if (ops.length > 0) await this.classeModel.bulkWrite(ops as any);
    }

    // Migrer les entrées historique_classes des élèves
    const elevesAvecHistoriqueSans = await this.eleveModel.find({
      historique_classes: { $elemMatch: { anneeScolaireId: { $in: ['', null, undefined] } } },
    }).lean().exec();

    if (elevesAvecHistoriqueSans.length > 0) {
      this.logger.log(`Migration anneeScolaireId : ${elevesAvecHistoriqueSans.length} élève(s) avec historique à migrer`);
      for (const eleve of elevesAvecHistoriqueSans) {
        const historique: any[] = (eleve as any).historique_classes || [];
        const newHistorique = historique.map((h: any) => {
          if (h.anneeScolaireId) return h;
          const anneeId = labelToId.get(h.annee_scolaire);
          return anneeId ? { ...h, anneeScolaireId: anneeId } : h;
        });
        await this.eleveModel.updateOne(
          { _id: eleve._id },
          { $set: { historique_classes: newHistorique } },
        );
      }
    }

    this.logger.log('Migration anneeScolaireId : terminée');
  }
}
