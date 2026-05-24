/**
 * Script de reset + reseed complet.
 * Usage : node server/src/data/reset-and-seed.js
 * Vide TOUTES les collections puis insère 3 années scolaires :
 *   - 2022-2023 (terminee) avec classes, eleves, notes, créneaux
 *   - 2023-2024 (terminee) avec classes, eleves, notes, créneaux
 *   - 2024-2025 (active)   avec classes, eleves, notes, créneaux
 */

const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/gestion-ecole';

// ─── helpers ──────────────────────────────────────────────────────────────────
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function pad(n) { return n.toString().padStart(2, '0'); }
function randInt(min, max) { return min + Math.floor(Math.random() * (max - min + 1)); }
function round05(v) { return Math.round(v * 2) / 2; }

const prenomM = ['Lucas','Hugo','Louis','Gabriel','Raphaël','Arthur','Jules','Adam','Léo','Nathan','Ethan','Mathis','Paul','Maxime','Alexandre','Thomas','Antoine','Baptiste','Clément','Victor','Théo','Nicolas','Julien','Pierre','Romain'];
const prenomF = ['Emma','Léa','Chloé','Manon','Camille','Sarah','Louise','Jade','Zoé','Lina','Alice','Julie','Margot','Clara','Inès','Anaïs','Léonie','Marie','Lucie','Charlotte','Eva','Romane','Pauline','Marine','Océane'];
const noms = ['Martin','Bernard','Thomas','Petit','Robert','Richard','Durand','Dubois','Moreau','Laurent','Simon','Michel','Lefebvre','Leroy','Roux','David','Bertrand','Morel','Fournier','Girard','Bonnet','Dupont','Lambert','Fontaine','Rousseau','Vincent','Muller','Faure','Andre','Mercier','Blanc','Guerin','Boyer','Garnier','Chevalier'];

// ─── données fixes (salles, matières, niveaux) ────────────────────────────────
const sallesData = [
  { nom: 'Salle 101', capacite: 30, description: 'Salle de cours standard', type: 'standard' },
  { nom: 'Salle 102', capacite: 30, description: 'Salle de cours standard', type: 'standard' },
  { nom: 'Salle 103', capacite: 25, description: 'Petite salle de cours', type: 'standard' },
  { nom: 'Salle 201', capacite: 35, description: 'Grande salle de cours', type: 'standard' },
  { nom: 'Salle 202', capacite: 30, description: 'Salle de cours standard', type: 'standard' },
  { nom: 'Labo Physique', capacite: 24, description: 'Laboratoire de physique-chimie', type: 'laboratoire' },
  { nom: 'Labo SVT', capacite: 24, description: 'Laboratoire de sciences de la vie', type: 'laboratoire' },
  { nom: 'Salle Info 1', capacite: 20, description: 'Salle informatique avec 20 postes', type: 'informatique' },
  { nom: 'Gymnase', capacite: 60, description: 'Gymnase principal', type: 'sport' },
  { nom: 'Salle Arts', capacite: 25, description: "Salle d'arts plastiques", type: 'arts' },
  { nom: 'Salle Musique', capacite: 30, description: 'Salle de musique', type: 'arts' },
];

const NIVEAUX = ['6ème','5ème','4ème','3ème','2nde','1ère','Terminale'];

const matieresData = [
  { nom: 'Mathématiques',   code: 'MATH',  couleur: '#2563eb', description: 'Algèbre, géométrie, analyse',
    coefficients: NIVEAUX.map(n => ({ niveau: n, coefficient: ['2nde','1ère','Terminale'].includes(n) ? 5 : 4 })) },
  { nom: 'Français',        code: 'FR',    couleur: '#7c3aed', description: 'Grammaire, littérature, expression écrite',
    coefficients: NIVEAUX.map(n => ({ niveau: n, coefficient: n === 'Terminale' ? 3 : 4 })) },
  { nom: 'Histoire-Géographie', code: 'HG', couleur: '#d97706', description: 'Histoire et géographie',
    coefficients: NIVEAUX.map(n => ({ niveau: n, coefficient: ['2nde','1ère','Terminale'].includes(n) ? 4 : 3 })) },
  { nom: 'Anglais',         code: 'ANG',   couleur: '#dc2626', description: 'Langue vivante 1',
    coefficients: NIVEAUX.map(n => ({ niveau: n, coefficient: 3 })) },
  { nom: 'Espagnol',        code: 'ESP',   couleur: '#db2777', description: 'Langue vivante 2',
    coefficients: ['4ème','3ème','2nde','1ère','Terminale'].map(n => ({ niveau: n, coefficient: 2 })) },
  { nom: 'Physique-Chimie', code: 'PC',    couleur: '#0891b2', description: 'Sciences physiques et chimiques',
    coefficients: NIVEAUX.map(n => ({ niveau: n, coefficient: ['2nde','1ère','Terminale'].includes(n) ? 4 : 3 })) },
  { nom: 'SVT',             code: 'SVT',   couleur: '#16a34a', description: 'Sciences de la vie et de la terre',
    coefficients: NIVEAUX.map(n => ({ niveau: n, coefficient: n === 'Terminale' ? 3 : 2 })) },
  { nom: 'Technologie',     code: 'TECH',  couleur: '#475569', description: 'Technologie et informatique',
    coefficients: ['6ème','5ème','4ème','3ème'].map(n => ({ niveau: n, coefficient: 2 })) },
  { nom: 'EPS',             code: 'EPS',   couleur: '#ea580c', description: 'Éducation physique et sportive',
    coefficients: NIVEAUX.map(n => ({ niveau: n, coefficient: 2 })) },
  { nom: 'Arts Plastiques', code: 'ARTS',  couleur: '#a855f7', description: 'Arts visuels et plastiques',
    coefficients: NIVEAUX.map(n => ({ niveau: n, coefficient: 1 })) },
  { nom: 'Musique',         code: 'MUS',   couleur: '#ec4899', description: 'Éducation musicale',
    coefficients: ['6ème','5ème','4ème','3ème'].map(n => ({ niveau: n, coefficient: 1 })) },
  { nom: 'Philosophie',     code: 'PHILO', couleur: '#8b5cf6', description: 'Philosophie (Terminale)',
    coefficients: [{ niveau: 'Terminale', coefficient: 7 }] },
  { nom: 'SES',             code: 'SES',   couleur: '#14b8a6', description: 'Sciences économiques et sociales',
    coefficients: ['2nde','1ère','Terminale'].map(n => ({ niveau: n, coefficient: 3 })) },
];

const niveauxConfig = [
  { nom: '6ème',      ordre: 0, description: 'Entrée au collège' },
  { nom: '5ème',      ordre: 1, description: 'Deuxième année de collège' },
  { nom: '4ème',      ordre: 2, description: 'Troisième année de collège' },
  { nom: '3ème',      ordre: 3, description: 'Dernière année de collège — brevet' },
  { nom: '2nde',      ordre: 4, description: 'Entrée au lycée' },
  { nom: '1ère',      ordre: 5, description: 'Première — épreuves anticipées du bac' },
  { nom: 'Terminale', ordre: 6, description: 'Terminale — baccalauréat' },
];

const enseignants = {
  MATH:'M. Dupont', FR:'Mme Martin', HG:'M. Bernard', ANG:'Mme Johnson',
  ESP:'Mme Garcia', PC:'M. Curie', SVT:'Mme Darwin', TECH:'M. Turing',
  EPS:'M. Coubertin', ARTS:'Mme Picasso', MUS:'M. Mozart', PHILO:'M. Socrate', SES:'Mme Keynes',
};

function birthYear(niveau) {
  const m = { '6ème':2013,'5ème':2012,'4ème':2011,'3ème':2010,'2nde':2009,'1ère':2008,'Terminale':2007 };
  return m[niveau] || 2010;
}

// ─── définition des classes par année ─────────────────────────────────────────
function classesForAnnee(label) {
  return [
    { nom: '6ème A', niveau: '6ème', annee_scolaire: label, capacite: 30, salle: 'Salle 101', salle_type: 'fixe' },
    { nom: '6ème B', niveau: '6ème', annee_scolaire: label, capacite: 28, salle: 'Salle 102', salle_type: 'fixe' },
    { nom: '5ème A', niveau: '5ème', annee_scolaire: label, capacite: 30, salle: 'Salle 201', salle_type: 'fixe' },
    { nom: '5ème B', niveau: '5ème', annee_scolaire: label, capacite: 30, salle: 'Salle 202', salle_type: 'fixe' },
    { nom: '4ème A', niveau: '4ème', annee_scolaire: label, capacite: 32, salle: 'Salle 101', salle_type: 'variable' },
    { nom: '4ème B', niveau: '4ème', annee_scolaire: label, capacite: 30, salle: 'Salle 102', salle_type: 'variable' },
    { nom: '3ème A', niveau: '3ème', annee_scolaire: label, capacite: 30, salle: 'Salle 201', salle_type: 'fixe' },
    { nom: '3ème B', niveau: '3ème', annee_scolaire: label, capacite: 28, salle: 'Salle 202', salle_type: 'fixe' },
    { nom: '2nde 1', niveau: '2nde', annee_scolaire: label, capacite: 35, salle: 'Salle 201', salle_type: 'variable' },
    { nom: '2nde 2', niveau: '2nde', annee_scolaire: label, capacite: 35, salle: 'Salle 202', salle_type: 'variable' },
    { nom: '1ère S',  niveau: '1ère', annee_scolaire: label, capacite: 32, salle: 'Salle 101', salle_type: 'variable' },
    { nom: '1ère ES', niveau: '1ère', annee_scolaire: label, capacite: 32, salle: 'Salle 102', salle_type: 'variable' },
    { nom: 'Terminale S',  niveau: 'Terminale', annee_scolaire: label, capacite: 30, salle: 'Salle 103', salle_type: 'variable' },
    { nom: 'Terminale ES', niveau: 'Terminale', annee_scolaire: label, capacite: 30, salle: 'Salle 201', salle_type: 'variable' },
  ];
}

// ─── génération élèves pour une liste de classes ───────────────────────────────
function genEleves(classes) {
  const arr = [];
  for (const c of classes) {
    const nb = randInt(20, 28);
    const usedNames = new Set();
    for (let i = 0; i < nb; i++) {
      const g = Math.random() > 0.5 ? 'M' : 'F';
      const prenom = g === 'M' ? pick(prenomM) : pick(prenomF);
      const nom = pick(noms);
      const y = birthYear(c.niveau);
      const emailKey = `${prenom.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'')}.${nom.toLowerCase()}`;
      const suffix = usedNames.has(emailKey) ? `${randInt(1,99)}` : '';
      usedNames.add(emailKey);
      arr.push({
        nom, prenom,
        date_naissance: `${y}-${pad(randInt(1,12))}-${pad(randInt(1,28))}`,
        genre: g,
        classe_id: c._id.toString(),
        statut: 'actif',
        email: `${emailKey}${suffix}@ecole.fr`,
        telephone: `06 ${pad(randInt(10,99))} ${pad(randInt(10,99))} ${pad(randInt(10,99))} ${pad(randInt(10,99))}`,
      });
    }
  }
  return arr;
}

// ─── génération notes ──────────────────────────────────────────────────────────
function genNotes(eleves, matieres, anneeLabel) {
  const [startY] = anneeLabel.split('-').map(Number);
  const arr = [];
  for (const e of eleves) {
    // chaque élève a des notes dans 7-10 matières, pour les 3 trimestres
    const mats = [...matieres].sort(() => Math.random() - 0.5).slice(0, randInt(7, 10));
    for (const m of mats) {
      for (let trim = 1; trim <= 3; trim++) {
        const nbNotes = randInt(2, 4);
        const monthBase = trim === 1 ? 9 : trim === 2 ? 12 : 3;
        const yearOffset = trim >= 3 ? 1 : 0;
        for (let i = 0; i < nbNotes; i++) {
          const base = 7 + Math.random() * 11;
          const v = round05(Math.min(20, Math.max(0, base + (Math.random() - 0.5) * 5)));
          arr.push({
            eleve_id: e._id.toString(),
            matiere_id: m._id.toString(),
            valeur: v,
            trimestre: trim,
            date: `${startY + yearOffset}-${pad(monthBase + randInt(0, 1))}-${pad(randInt(1, 25))}`,
            commentaire: Math.random() > 0.7
              ? pick(['Bon travail','Peut mieux faire','Excellent !','En progrès','Efforts insuffisants','Très bien','À revoir'])
              : undefined,
            annulee: false,
          });
        }
      }
    }
  }
  return arr;
}

// ─── génération créneaux ───────────────────────────────────────────────────────
function genCreneaux(classes, matieres) {
  const jours = ['Lundi','Mardi','Mercredi','Jeudi','Vendredi'];
  const heures = ['08:00','09:00','10:00','11:00','14:00','15:00','16:00'];
  const stdNoms = ['Salle 101','Salle 102','Salle 103','Salle 201','Salle 202'];
  const arr = [];

  for (const c of classes) {
    const mats = [...matieres].sort(() => Math.random() - 0.5).slice(0, randInt(8, 11));
    const occ = new Set();
    for (const m of mats) {
      const nb = Math.min(3, Math.max(1, Math.floor((m.coefficients?.[0]?.coefficient ?? 2) / 1.5)));
      for (let i = 0; i < nb; i++) {
        let attempts = 0, j, hd, hf;
        do {
          j = pick(jours);
          hd = pick(heures);
          const dur = m.code === 'EPS' ? 2 : (Math.random() > 0.7 ? 2 : 1);
          hf = `${pad(parseInt(hd) + dur)}:00`;
          attempts++;
        } while (occ.has(`${j}-${hd}`) && attempts < 30);
        if (attempts >= 30) continue;
        occ.add(`${j}-${hd}`);

        let salle = c.salle;
        if (c.salle_type === 'variable') {
          if (m.code === 'PC')   salle = 'Labo Physique';
          else if (m.code === 'SVT')  salle = 'Labo SVT';
          else if (m.code === 'TECH') salle = 'Salle Info 1';
          else if (m.code === 'EPS')  salle = 'Gymnase';
          else if (m.code === 'ARTS') salle = 'Salle Arts';
          else if (m.code === 'MUS')  salle = 'Salle Musique';
          else salle = pick(stdNoms);
        }

        arr.push({
          classe_id: c._id.toString(),
          matiere_id: m._id.toString(),
          matiere_nom: m.nom,
          matiere_couleur: m.couleur || '#2563eb',
          jour: j, heure_debut: hd, heure_fin: hf,
          salle,
          enseignant: enseignants[m.code] || '',
        });
      }
    }
  }
  return arr;
}

// ─── schemas minimalistes pour l'insertion directe ────────────────────────────
const toJSON = (doc, ret) => { ret.id = ret._id?.toString(); delete ret._id; delete ret.__v; return ret; };
const opts = { timestamps: true, toJSON: { virtuals: true, transform: toJSON } };

const SalleSchema    = new mongoose.Schema({ nom:String, capacite:Number, description:String, type:String, actif:{type:Boolean,default:true} }, opts);
const MatiereSchema  = new mongoose.Schema({ nom:String, code:String, couleur:String, description:String, coefficient:{type:Number,default:1}, coefficients:[{niveau:String,coefficient:Number}], actif:{type:Boolean,default:true} }, opts);
const NiveauSchema   = new mongoose.Schema({ nom:String, ordre:Number, description:String, matiere_ids:[String] }, opts);
const ClasseSchema   = new mongoose.Schema({ nom:String, niveau:String, annee_scolaire:String, capacite:Number, salle:String, salle_type:String, actif:{type:Boolean,default:true} }, opts);
const EleveSchema    = new mongoose.Schema({ nom:String, prenom:String, date_naissance:String, genre:String, classe_id:String, statut:{type:String,default:'actif'}, email:String, telephone:String }, opts);
const NoteSchema     = new mongoose.Schema({ eleve_id:String, matiere_id:String, valeur:Number, trimestre:Number, date:String, commentaire:String, annulee:{type:Boolean,default:false} }, opts);
const CreneauSchema  = new mongoose.Schema({ classe_id:String, matiere_id:String, matiere_nom:String, matiere_couleur:String, jour:String, heure_debut:String, heure_fin:String, salle:String, enseignant:String, professeur_id:String, professeur_nom:String }, opts);
const AnneeSchema    = new mongoose.Schema({ label:{type:String,unique:true}, debut:String, fin:String, statut:{type:String,enum:['active','terminee','preparation'],default:'preparation'}, historique:[{action:String,date:String,details:String}] }, opts);

// Read models (collections miroir)
const ReadClasseSchema  = new mongoose.Schema({}, { strict: false, timestamps: true });
const ReadEleveSchema   = new mongoose.Schema({}, { strict: false, timestamps: true });
const ReadNoteSchema    = new mongoose.Schema({}, { strict: false, timestamps: true });
const ReadCreneauSchema = new mongoose.Schema({}, { strict: false, timestamps: true });
const ReadMatiereSchema = new mongoose.Schema({}, { strict: false, timestamps: true });
const ReadSalleSchema   = new mongoose.Schema({}, { strict: false, timestamps: true });

async function main() {
  console.log('🔌 Connexion MongoDB...');
  await mongoose.connect(MONGO_URI);
  console.log('✅ Connecté à', MONGO_URI);

  const db = mongoose.connection.db;

  // ─── modèles ────────────────────────────────────────────────────────────────
  const Salle    = mongoose.model('Salle',    SalleSchema);
  const Matiere  = mongoose.model('Matiere',  MatiereSchema);
  const Niveau   = mongoose.model('Niveau',   NiveauSchema);
  const Classe   = mongoose.model('Classe',   ClasseSchema);
  const Eleve    = mongoose.model('Eleve',    EleveSchema);
  const Note     = mongoose.model('Note',     NoteSchema);
  const Creneau  = mongoose.model('Creneau',  CreneauSchema);
  const Annee    = mongoose.model('AnneeScolaire', AnneeSchema);

  const ReadClasse  = mongoose.model('ReadClasse',  ReadClasseSchema);
  const ReadEleve   = mongoose.model('ReadEleve',   ReadEleveSchema);
  const ReadNote    = mongoose.model('ReadNote',    ReadNoteSchema);
  const ReadCreneau = mongoose.model('ReadCreneau', ReadCreneauSchema);
  const ReadMatiere = mongoose.model('ReadMatiere', ReadMatiereSchema);
  const ReadSalle   = mongoose.model('ReadSalle',   ReadSalleSchema);

  // ─── reset complet ───────────────────────────────────────────────────────────
  console.log('\n🗑️  Nettoyage de toutes les collections...');
  const collections = [
    'salles','matieres','niveaus','classes','eleves','notes','creneaus',
    'anneescolaires','professeurs','teacherassignments',
    'elevequittes','eleveexclus','departs','exclusions',
    'readclasses','readeleves','readnotes','readcreneaus','readmatieres','readsalles',
  ];
  for (const col of collections) {
    try {
      await db.collection(col).deleteMany({});
      console.log(`  ✓ ${col} vidée`);
    } catch (e) {
      console.log(`  - ${col} inexistante ou erreur (ignorée)`);
    }
  }

  // ─── 1. Salles ───────────────────────────────────────────────────────────────
  console.log('\n📦 Insertion des salles...');
  const salles = await Salle.insertMany(sallesData);
  console.log(`  ✓ ${salles.length} salles`);

  // ─── 2. Matières ─────────────────────────────────────────────────────────────
  console.log('📦 Insertion des matières...');
  const matieres = await Matiere.insertMany(matieresData);
  console.log(`  ✓ ${matieres.length} matières`);

  // ─── 3. Niveaux (avec matiere_ids déduits des coefficients) ─────────────────
  console.log('📦 Insertion des niveaux...');
  const niveauxAvecIds = niveauxConfig.map(n => {
    const ids = matieres
      .filter(m => (m.coefficients || []).some(c => c.niveau === n.nom))
      .map(m => m._id.toString());
    return { ...n, matiere_ids: ids };
  });
  await Niveau.insertMany(niveauxAvecIds);
  console.log(`  ✓ ${niveauxConfig.length} niveaux`);

  // ─── 4. Boucle sur les 3 années ──────────────────────────────────────────────
  const anneesConfig = [
    { label: '2022-2023', debut: '2022-09-05', fin: '2023-07-08', statut: 'terminee' },
    { label: '2023-2024', debut: '2023-09-04', fin: '2024-07-06', statut: 'terminee' },
    { label: '2024-2025', debut: '2024-09-02', fin: '2025-07-05', statut: 'active' },
  ];

  let totalClasses = 0, totalEleves = 0, totalNotes = 0, totalCreneaux = 0;

  for (const anneeConf of anneesConfig) {
    console.log(`\n📅 Année ${anneeConf.label} (${anneeConf.statut})...`);
    const now = new Date().toISOString();

    const historique = [
      { action: 'creation', date: now, details: `Année "${anneeConf.label}" créée par le script de reseed` },
      { action: 'demarrage', date: now, details: `Année "${anneeConf.label}" démarrée` },
    ];
    if (anneeConf.statut === 'terminee') {
      historique.push({ action: 'cloture', date: now, details: `Année "${anneeConf.label}" terminée` });
    }

    await Annee.create({ ...anneeConf, historique });

    // Classes
    const classesDefs = classesForAnnee(anneeConf.label);
    const classes = await Classe.insertMany(classesDefs);
    totalClasses += classes.length;
    console.log(`  ✓ ${classes.length} classes`);

    // Élèves
    const elevesRaw = genEleves(classes);
    const eleves = await Eleve.insertMany(elevesRaw);
    totalEleves += eleves.length;
    console.log(`  ✓ ${eleves.length} élèves`);

    // Notes (3 trimestres complets)
    const notesRaw = genNotes(eleves, matieres, anneeConf.label);
    await Note.insertMany(notesRaw);
    totalNotes += notesRaw.length;
    console.log(`  ✓ ${notesRaw.length} notes (3 trimestres)`);

    // Créneaux
    const creneauxRaw = genCreneaux(classes, matieres);
    await Creneau.insertMany(creneauxRaw);
    totalCreneaux += creneauxRaw.length;
    console.log(`  ✓ ${creneauxRaw.length} créneaux`);
  }

  // ─── 5. Rebuild des read models (pour l'année active 2024-2025) ──────────────
  console.log('\n🔄 Rebuild des read models...');

  const allClasses   = await Classe.find({ actif: { $ne: false } }).lean();
  const allEleves    = await Eleve.find().lean();
  const allNotes     = await Note.find({ annulee: { $ne: true } }).lean();
  const allCreneaux  = await Creneau.find().lean();
  const allMatieres  = await Matiere.find({ actif: { $ne: false } }).lean();
  const allSalles    = await Salle.find({ actif: { $ne: false } }).lean();

  // Maps utiles
  const classeMap   = new Map(allClasses.map(c  => [c._id.toString(), c]));
  const matiereMap  = new Map(allMatieres.map(m  => [m._id.toString(), m]));
  const eleveMap    = new Map(allEleves.map(e  => [e._id.toString(), e]));

  // ReadClasse : nb_eleves + taux
  const eleveCountByClasse = {};
  for (const e of allEleves) {
    if (e.statut === 'actif') {
      eleveCountByClasse[e.classe_id] = (eleveCountByClasse[e.classe_id] || 0) + 1;
    }
  }
  const readClassesDocs = allClasses.map(c => {
    const sid = c._id.toString();
    const nb = eleveCountByClasse[sid] || 0;
    return { source_id: sid, nom: c.nom, niveau: c.niveau, annee_scolaire: c.annee_scolaire,
      capacite: c.capacite, salle: c.salle, salle_type: c.salle_type, actif: c.actif,
      nb_eleves: nb, taux: c.capacite > 0 ? Math.round(nb / c.capacite * 100) : 0 };
  });
  await ReadClasse.insertMany(readClassesDocs);
  console.log(`  ✓ ${readClassesDocs.length} ReadClasse`);

  // ReadEleve
  const readElevesDocs = allEleves.map(e => {
    const cl = classeMap.get(e.classe_id);
    return { source_id: e._id.toString(), nom: e.nom, prenom: e.prenom,
      date_naissance: e.date_naissance, genre: e.genre, classe_id: e.classe_id,
      classe_nom: cl?.nom || '', classe_niveau: cl?.niveau || '',
      statut: e.statut || 'actif', email: e.email, telephone: e.telephone };
  });
  await ReadEleve.insertMany(readElevesDocs);
  console.log(`  ✓ ${readElevesDocs.length} ReadEleve`);

  // ReadMatiere
  const readMatiereDocs = allMatieres.map(m => ({
    source_id: m._id.toString(), nom: m.nom, code: m.code, couleur: m.couleur,
    description: m.description, coefficient: m.coefficient,
    coefficients: m.coefficients, actif: m.actif,
  }));
  await ReadMatiere.insertMany(readMatiereDocs);
  console.log(`  ✓ ${readMatiereDocs.length} ReadMatiere`);

  // ReadSalle
  const readSalleDocs = allSalles.map(s => ({
    source_id: s._id.toString(), nom: s.nom, capacite: s.capacite,
    description: s.description, type: s.type, actif: s.actif,
  }));
  await ReadSalle.insertMany(readSalleDocs);
  console.log(`  ✓ ${readSalleDocs.length} ReadSalle`);

  // ReadNote
  const readNoteDocs = allNotes.map(n => {
    const e = eleveMap.get(n.eleve_id);
    const m = matiereMap.get(n.matiere_id);
    return { source_id: n._id.toString(), eleve_id: n.eleve_id,
      eleve_nom: e ? `${e.prenom} ${e.nom}` : '', matiere_id: n.matiere_id,
      matiere_nom: m?.nom || '', matiere_couleur: m?.couleur || '#64748b',
      valeur: n.valeur, trimestre: n.trimestre, date: n.date,
      commentaire: n.commentaire, annulee: n.annulee };
  });
  await ReadNote.insertMany(readNoteDocs);
  console.log(`  ✓ ${readNoteDocs.length} ReadNote`);

  // ReadCreneau
  const readCreneauDocs = allCreneaux.map(cr => {
    const cl = classeMap.get(cr.classe_id);
    const m  = matiereMap.get(cr.matiere_id);
    return { source_id: cr._id.toString(), classe_id: cr.classe_id,
      classe_nom: cl?.nom || '', matiere_id: cr.matiere_id,
      matiere_nom: m?.nom || cr.matiere_nom, matiere_couleur: m?.couleur || cr.matiere_couleur,
      jour: cr.jour, heure_debut: cr.heure_debut, heure_fin: cr.heure_fin,
      salle: cr.salle, enseignant: cr.enseignant,
      professeur_id: cr.professeur_id, professeur_nom: cr.professeur_nom };
  });
  await ReadCreneau.insertMany(readCreneauDocs);
  console.log(`  ✓ ${readCreneauDocs.length} ReadCreneau`);

  // ─── Résumé ─────────────────────────────────────────────────────────────────
  console.log('\n🎉 Reseed terminé avec succès !');
  console.log('─────────────────────────────────────');
  console.log(`  Salles    : ${salles.length}`);
  console.log(`  Matières  : ${matieres.length}`);
  console.log(`  Niveaux   : ${niveauxConfig.length}`);
  console.log(`  Classes   : ${totalClasses} (sur 3 années)`);
  console.log(`  Élèves    : ${totalEleves}`);
  console.log(`  Notes     : ${totalNotes} (3 trimestres × 3 années)`);
  console.log(`  Créneaux  : ${totalCreneaux}`);
  console.log('─────────────────────────────────────');
  console.log('  Années scolaires :');
  console.log('    2022-2023 → terminee (archive testable)');
  console.log('    2023-2024 → terminee (archive testable)');
  console.log('    2024-2025 → active   (données courantes)');

  await mongoose.disconnect();
  console.log('\n✅ Déconnecté. Lance le serveur normalement.');
}

main().catch(e => { console.error('❌ Erreur fatale:', e); process.exit(1); });
