// Script à lancer UNE SEULE FOIS via : npx ts-node -r tsconfig-paths/register server/src/data/migration-professeurs.ts
import mongoose from 'mongoose';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/gestion-ecole';

const CreneauSchema = new mongoose.Schema({ classe_id: String, matiere_id: String, enseignant: String }, { strict: false });
const ProfesseurSchema = new mongoose.Schema({ nom: String, prenom: String, email: String, telephone: String, genre: String, statut: String }, { timestamps: true });
const TeacherAssignmentSchema = new mongoose.Schema({ professeur_id: String, classe_id: String, matiere_id: String }, { timestamps: true });
TeacherAssignmentSchema.index({ classe_id: 1, matiere_id: 1 }, { unique: true });

async function migrate() {
  await mongoose.connect(MONGO_URI);
  console.log('Connecté à MongoDB');

  const CreneauModel = mongoose.model('Creneau', CreneauSchema, 'creneaux');
  const ProfesseurModel = mongoose.model('Professeur', ProfesseurSchema, 'professeurs');
  const AssignmentModel = mongoose.model('TeacherAssignment', TeacherAssignmentSchema, 'teacherassignments');

  const creneaux = await CreneauModel.find({ enseignant: { $exists: true, $ne: '' } }).lean().exec();
  console.log(`${creneaux.length} créneaux avec enseignant trouvés`);

  const nomToProfId = new Map<string, string>();
  let profsCreés = 0;

  for (const cr of creneaux) {
    const enseignant = (cr as any).enseignant as string;
    if (!enseignant || nomToProfId.has(enseignant)) continue;

    let genre: string = 'M';
    let nom = enseignant;
    if (enseignant.startsWith('Mme ')) { genre = 'F'; nom = enseignant.slice(4).trim(); }
    else if (enseignant.startsWith('M. ')) { genre = 'M'; nom = enseignant.slice(3).trim(); }
    else if (enseignant.startsWith('M ')) { genre = 'M'; nom = enseignant.slice(2).trim(); }

    const existing = await ProfesseurModel.findOne({ nom, genre }).exec();
    if (existing) {
      nomToProfId.set(enseignant, (existing._id as any).toString());
    } else {
      const created = await new ProfesseurModel({ nom, prenom: '', email: '', telephone: '', genre, statut: 'actif' }).save();
      nomToProfId.set(enseignant, (created._id as any).toString());
      profsCreés++;
    }
  }

  console.log(`${profsCreés} professeurs créés`);

  let assignmentsCreés = 0;
  for (const cr of creneaux) {
    const enseignant = (cr as any).enseignant as string;
    if (!enseignant) continue;
    const professeurId = nomToProfId.get(enseignant);
    if (!professeurId) continue;
    try {
      await AssignmentModel.findOneAndUpdate(
        { classe_id: (cr as any).classe_id, matiere_id: (cr as any).matiere_id },
        { professeur_id: professeurId, classe_id: (cr as any).classe_id, matiere_id: (cr as any).matiere_id },
        { upsert: true, new: true },
      );
      assignmentsCreés++;
    } catch (e: any) {
      if (e.code !== 11000) console.error(`Erreur assignment: ${e.message}`);
    }
  }

  console.log(`${assignmentsCreés} assignments créés/mis à jour`);

  const result = await CreneauModel.updateMany({}, { $unset: { enseignant: '' } });
  console.log(`Champ enseignant supprimé sur ${result.modifiedCount} créneaux`);

  await mongoose.disconnect();
  console.log('Migration terminée');
}

migrate().catch(e => { console.error(e); process.exit(1); });
