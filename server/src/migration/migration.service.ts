import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Eleve } from '../eleves/eleve.schema';
import { Classe } from '../classes/classe.schema';
import { Absence } from '../suivi/absence.schema';
import { Convocation } from '../suivi/convocation.schema';
import { AnneeScolaire } from '../annees/annee.schema';

@Injectable()
export class MigrationService implements OnModuleInit {
  private readonly logger = new Logger('Migration');

  constructor(
    @InjectModel(Eleve.name) private eleveModel: Model<Eleve>,
    @InjectModel(Classe.name) private classeModel: Model<Classe>,
    @InjectModel(Absence.name) private absenceModel: Model<Absence>,
    @InjectModel(Convocation.name) private convocationModel: Model<Convocation>,
    @InjectModel(AnneeScolaire.name) private anneeModel: Model<AnneeScolaire>,
  ) {}

  async onModuleInit() {
    await this.migrateAbsences();
    await this.migrateConvocations();
    await this.migrateHistoriqueClasses();
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
}
