/**
 * Script de migration idempotent : migre les AnneeScolaire et Eleve existants
 * vers le nouveau schéma (debut_planifie / fin_planifie + inscrit_annee_id).
 *
 * Skip silencieux : si debut_planifie déjà renseigné → doc sauté.
 * Relancer = sans effet.
 *
 * Usage : cd server && npx ts-node src/migration/migrate-dates-annee.ts
 */

import * as mongoose from 'mongoose';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/gestion-ecole';

async function run() {
  await mongoose.connect(MONGO_URI);
  console.log('Connecté à MongoDB');

  const db = mongoose.connection.db;
  const anneesColl = db.collection('anneescolaires');
  const elevesColl = db.collection('eleves');
  const classesColl = db.collection('classes');

  // ── ÉTAPE A : Migration des AnneeScolaire ──────────────────────────────────
  const annees = await anneesColl.find({}).toArray();
  let anneesMigrees = 0;
  let anneesSkip = 0;

  for (const a of annees) {
    if (a.debut_planifie != null) {
      console.log(`  SKIP année : ${a.label}`);
      anneesSkip++;
      continue;
    }

    const debutReel = (a.statut === 'active' || a.statut === 'terminee') ? (a.debut ?? null) : null;
    const finReel   = a.statut === 'terminee' ? (a.fin ?? null) : null;

    await anneesColl.updateOne(
      { _id: a._id },
      {
        $set: {
          debut_planifie: a.debut ?? null,
          fin_planifie:   a.fin   ?? null,
          debut_reel:     debutReel,
          fin_reel:       finReel,
          migration_effectuee: false,
        },
      },
    );
    console.log(`  MIGRÉ année : ${a.label} (debut_planifie=${a.debut}, fin_planifie=${a.fin})`);
    anneesMigrees++;
  }

  console.log(`Années — migrées: ${anneesMigrees}, sautées: ${anneesSkip}`);

  // ── ÉTAPE B : Migration des Eleve ─────────────────────────────────────────
  const anneeActive = await anneesColl.findOne({ statut: 'active' });

  let classeIdsActive: string[] = [];
  if (anneeActive) {
    const classesActives = await classesColl.find({
      $or: [
        { anneeScolaireId: anneeActive._id.toString() },
        { annee_scolaire: anneeActive.label },
      ],
    }).toArray();
    classeIdsActive = classesActives.map((c: any) => c._id.toString());
  }

  const eleves = await elevesColl.find({}).toArray();
  let elevesMigres = 0;
  let elevesSkip = 0;

  for (const e of eleves) {
    if (e.inscrit_annee_id != null) {
      elevesSkip++;
      continue;
    }

    const estActifDansAnneeActive =
      anneeActive &&
      e.statut === 'actif' &&
      classeIdsActive.includes(e.classe_id);

    if (estActifDansAnneeActive) {
      await elevesColl.updateOne(
        { _id: e._id },
        {
          $set: {
            inscrit_annee_id:   anneeActive!._id.toString(),
            statut_inscription: 'inscrit',
          },
        },
      );
    } else {
      await elevesColl.updateOne(
        { _id: e._id },
        {
          $set: {
            inscrit_annee_id:   null,
            statut_inscription: null,
          },
        },
      );
    }
    elevesMigres++;
  }

  console.log(`Élèves — migrés: ${elevesMigres}, sautés: ${elevesSkip}`);

  await mongoose.disconnect();
  console.log('Migration terminée.');
}

run().catch(err => {
  console.error('Erreur migration :', err);
  process.exit(1);
});
