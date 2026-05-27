/**
 * Script de migration one-shot : annee_scolaire: string → anneeScolaireId: ObjectId
 *
 * Ce script est IDEMPOTENT : il peut être relancé sans risque.
 * Il ne modifie que les documents où anneeScolaireId est absent.
 *
 * Usage : cd server && npx ts-node src/migration/migrate-to-annee-id.ts
 */

import mongoose from 'mongoose';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/gestion-ecole';

// Collections write à migrer (champ de niveau racine)
const ROOT_COLLECTIONS = [
  'classes',
  'notes',
  'periodes',         // collection réelle : "periodevaluations" → voir ci-dessous
  'evaluations',
  'absences',
  'avertissements',
  'convocations',
  'elevexclus',
  'elevequittes',
];

// Noms réels des collections Mongoose (snake_case pluriel NestJS)
// On les détecte dynamiquement depuis la liste des collections MongoDB
const COLLECTION_ALIASES: Record<string, string[]> = {
  classes: ['classes'],
  notes: ['notes'],
  periodes: ['periodevaluations', 'periode_evaluations', 'periodes'],
  evaluations: ['evaluations'],
  absences: ['absences'],
  avertissements: ['avertissements'],
  convocations: ['convocations'],
  elevexclus: ['elevexclus', 'eleve_exclus'],
  elevequittes: ['elevequittes', 'eleve_quittes'],
};

// Read models à migrer aussi (pour que les filtres anneeId fonctionnent côté lecture)
const READ_COLLECTIONS = [
  'read_classes',
  'read_eleves',
  'read_notes',
  'read_evaluations',
];

async function run() {
  console.log('🔄 Connexion MongoDB…');
  await mongoose.connect(MONGO_URI);
  const db = mongoose.connection.db!;

  // ─── 1. Charger les AnneeScolaire et construire la map label → id ───────────
  const anneesCol = db.collection('anneescolaires');
  const annees = await anneesCol.find({}).toArray();
  if (annees.length === 0) {
    console.error('❌ Aucune AnneeScolaire trouvée en base. Migration impossible.');
    process.exit(1);
  }

  const labelToId = new Map<string, string>();
  for (const a of annees) {
    labelToId.set(a.label, a._id.toString());
    console.log(`  📅 AnneeScolaire : "${a.label}" → ${a._id}`);
  }

  // ─── 2. Détecter les noms réels des collections ──────────────────────────────
  const existingCollections = (await db.listCollections().toArray()).map(c => c.name);

  function resolveCollectionName(aliases: string[]): string | null {
    for (const alias of aliases) {
      if (existingCollections.includes(alias)) return alias;
    }
    return null;
  }

  // ─── 3. Migrer les collections write (champ racine) ──────────────────────────
  for (const [key, aliases] of Object.entries(COLLECTION_ALIASES)) {
    const colName = resolveCollectionName(aliases);
    if (!colName) {
      console.log(`⚠️  Collection "${key}" introuvable (essayé: ${aliases.join(', ')}) — ignorée`);
      continue;
    }

    const col = db.collection(colName);
    const sans = await col.countDocuments({ anneeScolaireId: { $exists: false } });
    if (sans === 0) {
      console.log(`✅ ${colName} : déjà migré (0 document sans anneeScolaireId)`);
      continue;
    }

    console.log(`🔧 ${colName} : ${sans} document(s) à migrer…`);
    const docs = await col.find({ anneeScolaireId: { $exists: false } }).toArray();
    let ok = 0, orphelins = 0;

    const ops: any[] = [];
    for (const doc of docs) {
      const label = doc.annee_scolaire;
      const anneeId = labelToId.get(label);
      if (!anneeId) {
        orphelins++;
        console.warn(`  ⚠️  Doc ${doc._id} : label "${label}" introuvable dans AnneeScolaire`);
        continue;
      }
      ops.push({
        updateOne: {
          filter: { _id: doc._id },
          update: { $set: { anneeScolaireId: anneeId } },
        },
      });
      ok++;
    }

    if (ops.length > 0) await col.bulkWrite(ops);
    console.log(`  ✅ ${colName} : ${ok} migré(s), ${orphelins} orphelin(s)`);
  }

  // ─── 4. Migrer eleves.historique_classes[] ───────────────────────────────────
  const elevesCol = db.collection('eleves');
  const totalEleves = await elevesCol.countDocuments({});
  console.log(`\n🔧 eleves (historique_classes) : ${totalEleves} élève(s) à vérifier…`);

  const elevesWithMissingId = await elevesCol.find({
    historique_classes: {
      $elemMatch: { anneeScolaireId: { $exists: false } },
    },
  }).toArray();

  console.log(`  → ${elevesWithMissingId.length} élève(s) avec des entrées sans anneeScolaireId`);

  let eleveUpdated = 0;
  for (const eleve of elevesWithMissingId) {
    const historique: any[] = eleve.historique_classes || [];
    const newHistorique = historique.map((h: any) => {
      if (h.anneeScolaireId) return h; // déjà migré
      const anneeId = labelToId.get(h.annee_scolaire);
      if (!anneeId) {
        console.warn(`  ⚠️  Élève ${eleve._id}, historique "${h.annee_scolaire}" introuvable`);
        return h; // laisser tel quel
      }
      return { ...h, anneeScolaireId: anneeId };
    });

    await elevesCol.updateOne(
      { _id: eleve._id },
      { $set: { historique_classes: newHistorique } },
    );
    eleveUpdated++;
  }
  console.log(`  ✅ eleves : ${eleveUpdated} élève(s) mis à jour`);

  // ─── 5. Migrer les read models ───────────────────────────────────────────────
  console.log('\n🔧 Migration des read models…');
  for (const readColName of READ_COLLECTIONS) {
    if (!existingCollections.includes(readColName)) {
      console.log(`⚠️  Collection "${readColName}" introuvable — ignorée`);
      continue;
    }
    const col = db.collection(readColName);
    const sans = await col.countDocuments({ anneeScolaireId: { $exists: false } });
    if (sans === 0) {
      console.log(`✅ ${readColName} : déjà migré`);
      continue;
    }

    const docs = await col.find({ anneeScolaireId: { $exists: false } }).toArray();
    let ok = 0, orphelins = 0;
    const ops: any[] = [];

    for (const doc of docs) {
      const label = doc.annee_scolaire;
      const anneeId = labelToId.get(label);
      if (!anneeId) { orphelins++; continue; }
      ops.push({
        updateOne: {
          filter: { _id: doc._id },
          update: { $set: { anneeScolaireId: anneeId } },
        },
      });
      ok++;
    }

    if (ops.length > 0) await col.bulkWrite(ops);
    console.log(`  ✅ ${readColName} : ${ok} migré(s), ${orphelins} orphelin(s)`);
  }

  // ─── 6. Rapport final ────────────────────────────────────────────────────────
  console.log('\n📊 Rapport de validation :');
  for (const [key, aliases] of Object.entries(COLLECTION_ALIASES)) {
    const colName = resolveCollectionName(aliases);
    if (!colName) continue;
    const col = db.collection(colName);
    const restants = await col.countDocuments({ anneeScolaireId: { $exists: false } });
    const status = restants === 0 ? '✅' : `❌ (${restants} restants)`;
    console.log(`  ${status} ${colName}`);
  }

  const elevesRestants = await elevesCol.countDocuments({
    historique_classes: { $elemMatch: { anneeScolaireId: { $exists: false } } },
  });
  console.log(`  ${elevesRestants === 0 ? '✅' : `❌ (${elevesRestants} restants)`} eleves (historique_classes)`);

  for (const readColName of READ_COLLECTIONS) {
    if (!existingCollections.includes(readColName)) continue;
    const col = db.collection(readColName);
    const restants = await col.countDocuments({ anneeScolaireId: { $exists: false } });
    console.log(`  ${restants === 0 ? '✅' : `❌ (${restants} restants)`} ${readColName}`);
  }

  await mongoose.disconnect();
  console.log('\n✅ Migration terminée !');
}

run().catch(err => {
  console.error('❌ Erreur migration :', err);
  process.exit(1);
});
