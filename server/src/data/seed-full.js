// ============================================================
// SCRIPT DE SEEDING COMPLET — GestionÉcole
// Usage : mongosh gestion-ecole seed-full.js
// ============================================================

// ─── HELPERS ────────────────────────────────────────────────
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function pad(n) { return n.toString().padStart(2, '0'); }
function randInt(min, max) { return min + Math.floor(Math.random() * (max - min + 1)); }
function randFloat(min, max) {
  const v = min + Math.random() * (max - min);
  return Math.round(v * 2) / 2; // arrondi au 0.5
}
function dateStr(y, m, d) { return `${y}-${pad(m)}-${pad(d)}`; }
function oid() { return new ObjectId(); }
function clamp(v, min, max) { return Math.min(max, Math.max(min, v)); }

const prenomM = ['Lucas','Hugo','Louis','Gabriel','Raphaël','Arthur','Jules','Adam','Léo','Nathan','Ethan','Mathis','Paul','Maxime','Alexandre','Thomas','Antoine','Baptiste','Clément','Victor','Théo','Nicolas','Julien','Pierre','Romain','Quentin','Axel','Dylan','Enzo','Mathéo','Florian','Damien','Alexis','Kevin','Sébastien'];
const prenomF = ['Emma','Léa','Chloé','Manon','Camille','Sarah','Louise','Jade','Zoé','Lina','Alice','Julie','Margot','Clara','Inès','Anaïs','Léonie','Marie','Lucie','Charlotte','Eva','Romane','Pauline','Marine','Océane','Ambre','Juliette','Lisa','Laura','Mathilde','Elisa','Noémie','Aurélie','Céline','Sandrine'];
const noms = ['Martin','Bernard','Thomas','Petit','Robert','Richard','Durand','Dubois','Moreau','Laurent','Simon','Michel','Lefebvre','Leroy','Roux','David','Bertrand','Morel','Fournier','Girard','Bonnet','Dupont','Lambert','Fontaine','Rousseau','Vincent','Muller','Faure','Andre','Mercier','Blanc','Guerin','Boyer','Garnier','Chevalier','François','Legrand','Gauthier','Garcia','Martinez'];

const commentaires = [
  'Excellent travail, continue ainsi !',
  'Bon trimestre dans l\'ensemble.',
  'Peut mieux faire, manque de régularité.',
  'En progrès constant — persévérance appréciée.',
  'Résultats insuffisants, travail à intensifier.',
  'Très bonne maîtrise des notions abordées.',
  'Participation active et de qualité en classe.',
  'Manque de concentration par moments.',
  'Travail sérieux et régulier à féliciter.',
  'Des efforts notables depuis le début du trimestre.',
  'Élève sérieux mais doit s\'impliquer davantage à l\'oral.',
  'Bonne progression depuis le début de l\'année.',
  null, null, null, null, null,
];

// ─── SALLES ──────────────────────────────────────────────────
const sallesData = [
  { _id: oid(), nom: 'Salle 101', capacite: 30, description: 'Salle standard — Bâtiment A', type: 'standard', batiment: 'A', etage: '1', equipements: ['tableau_blanc','videoprojecteur'], accessible_pmr: true },
  { _id: oid(), nom: 'Salle 102', capacite: 30, description: 'Salle standard — Bâtiment A', type: 'standard', batiment: 'A', etage: '1', equipements: ['tableau_blanc'], accessible_pmr: false },
  { _id: oid(), nom: 'Salle 103', capacite: 25, description: 'Petite salle — Bâtiment A',   type: 'standard', batiment: 'A', etage: '1', equipements: ['tableau_blanc','videoprojecteur'], accessible_pmr: false },
  { _id: oid(), nom: 'Salle 201', capacite: 35, description: 'Grande salle — Bâtiment A',   type: 'standard', batiment: 'A', etage: '2', equipements: ['tableau_blanc','videoprojecteur','tableau_interactif'], accessible_pmr: false },
  { _id: oid(), nom: 'Salle 202', capacite: 30, description: 'Salle standard — Bâtiment A', type: 'standard', batiment: 'A', etage: '2', equipements: ['tableau_blanc'], accessible_pmr: false },
  { _id: oid(), nom: 'Salle 203', capacite: 28, description: 'Salle polyvalente — Bâtiment A', type: 'standard', batiment: 'A', etage: '2', equipements: ['tableau_blanc','videoprojecteur'], accessible_pmr: false },
  { _id: oid(), nom: 'Labo Physique', capacite: 24, description: 'Laboratoire de physique-chimie', type: 'laboratoire', batiment: 'B', etage: '1', equipements: ['hotte','tableau_blanc'], accessible_pmr: false },
  { _id: oid(), nom: 'Labo SVT',      capacite: 24, description: 'Laboratoire de sciences de la vie', type: 'laboratoire', batiment: 'B', etage: '1', equipements: ['microscopes','tableau_blanc'], accessible_pmr: false },
  { _id: oid(), nom: 'Salle Info 1',  capacite: 20, description: 'Informatique — 20 postes iMac',     type: 'informatique', batiment: 'B', etage: '2', equipements: ['ordinateurs','videoprojecteur'], accessible_pmr: true },
  { _id: oid(), nom: 'Salle Info 2',  capacite: 18, description: 'Informatique — 18 postes Windows',  type: 'informatique', batiment: 'B', etage: '2', equipements: ['ordinateurs'], accessible_pmr: false },
  { _id: oid(), nom: 'Gymnase',       capacite: 60, description: 'Gymnase principal (basket, volley)', type: 'sport',         batiment: 'C', etage: 'RDC', equipements: [], accessible_pmr: true },
  { _id: oid(), nom: 'Salle Arts',    capacite: 25, description: "Atelier d'arts plastiques",          type: 'arts',          batiment: 'C', etage: '1',   equipements: ['tableau_blanc'], accessible_pmr: false },
];

const salleByNom = {};
sallesData.forEach(s => { salleByNom[s.nom] = s._id; });

// ─── MATIÈRES ────────────────────────────────────────────────
const niveaux7 = ['6ème','5ème','4ème','3ème','2nde','1ère','Terminale'];
const matieresData = [
  { _id: oid(), nom: 'Mathématiques',       code: 'MATH',  couleur: '#2563eb', description: 'Algèbre, géométrie, analyse, probabilités',
    coefficients: niveaux7.map(n => ({ niveau: n, coefficient: ['2nde','1ère','Terminale'].includes(n) ? 5 : 4 })) },
  { _id: oid(), nom: 'Français',            code: 'FR',    couleur: '#7c3aed', description: 'Grammaire, littérature, expression écrite et orale',
    coefficients: niveaux7.map(n => ({ niveau: n, coefficient: n === 'Terminale' ? 3 : 4 })) },
  { _id: oid(), nom: 'Histoire-Géographie', code: 'HG',    couleur: '#d97706', description: 'Histoire contemporaine, géographie humaine',
    coefficients: niveaux7.map(n => ({ niveau: n, coefficient: ['2nde','1ère','Terminale'].includes(n) ? 4 : 3 })) },
  { _id: oid(), nom: 'Anglais',             code: 'ANG',   couleur: '#dc2626', description: 'Langue vivante 1',
    coefficients: niveaux7.map(n => ({ niveau: n, coefficient: 3 })) },
  { _id: oid(), nom: 'Espagnol',            code: 'ESP',   couleur: '#db2777', description: 'Langue vivante 2 — espagnol',
    coefficients: ['4ème','3ème','2nde','1ère','Terminale'].map(n => ({ niveau: n, coefficient: 2 })) },
  { _id: oid(), nom: 'Physique-Chimie',     code: 'PC',    couleur: '#0891b2', description: 'Mécanique, électricité, chimie',
    coefficients: niveaux7.map(n => ({ niveau: n, coefficient: ['2nde','1ère','Terminale'].includes(n) ? 4 : 3 })) },
  { _id: oid(), nom: 'SVT',                 code: 'SVT',   couleur: '#16a34a', description: 'Biologie, écologie, géologie',
    coefficients: niveaux7.map(n => ({ niveau: n, coefficient: n === 'Terminale' ? 3 : 2 })) },
  { _id: oid(), nom: 'Technologie',         code: 'TECH',  couleur: '#475569', description: 'Technologie, conception, informatique',
    coefficients: ['6ème','5ème','4ème','3ème'].map(n => ({ niveau: n, coefficient: 2 })) },
  { _id: oid(), nom: 'EPS',                 code: 'EPS',   couleur: '#ea580c', description: 'Éducation physique et sportive',
    coefficients: niveaux7.map(n => ({ niveau: n, coefficient: 2 })) },
  { _id: oid(), nom: 'Arts Plastiques',     code: 'ARTS',  couleur: '#a855f7', description: 'Arts visuels, design, histoire de l\'art',
    coefficients: niveaux7.map(n => ({ niveau: n, coefficient: 1 })) },
  { _id: oid(), nom: 'Musique',             code: 'MUS',   couleur: '#ec4899', description: 'Éducation musicale et chant choral',
    coefficients: ['6ème','5ème','4ème','3ème'].map(n => ({ niveau: n, coefficient: 1 })) },
  { _id: oid(), nom: 'Allemand',            code: 'ALL',   couleur: '#f59e0b', description: 'Langue vivante 2 — allemand',
    coefficients: ['4ème','3ème','2nde','1ère','Terminale'].map(n => ({ niveau: n, coefficient: 2 })) },
  { _id: oid(), nom: 'Latin',               code: 'LAT',   couleur: '#6366f1', description: 'Langue et culture antiques',
    coefficients: ['5ème','4ème','3ème'].map(n => ({ niveau: n, coefficient: 2 })) },
  { _id: oid(), nom: 'Philosophie',         code: 'PHILO', couleur: '#8b5cf6', description: 'Philosophie — épistémologie, éthique',
    coefficients: [{ niveau: 'Terminale', coefficient: 7 }] },
  { _id: oid(), nom: 'SES',                 code: 'SES',   couleur: '#14b8a6', description: 'Sciences économiques et sociales',
    coefficients: ['2nde','1ère','Terminale'].map(n => ({ niveau: n, coefficient: 3 })) },
];

const matiereByCode = {};
matieresData.forEach(m => { matiereByCode[m.code] = m; });

// ─── PROFESSEURS ─────────────────────────────────────────────
const professeursData = [
  { _id: oid(), nom: 'Dupont',     prenom: 'Jean',        genre: 'M', email: 'j.dupont@ecole.fr',     telephone: '06 12 34 56 78', statut: 'actif',   matieres_codes: ['MATH'] },
  { _id: oid(), nom: 'Leroy',      prenom: 'Alain',       genre: 'M', email: 'a.leroy@ecole.fr',      telephone: '06 67 78 89 90', statut: 'actif',   matieres_codes: ['MATH'] },
  { _id: oid(), nom: 'Martin',     prenom: 'Sophie',      genre: 'F', email: 's.martin@ecole.fr',     telephone: '06 23 45 67 89', statut: 'actif',   matieres_codes: ['FR'] },
  { _id: oid(), nom: 'Rousseau',   prenom: 'Nathalie',    genre: 'F', email: 'n.rousseau@ecole.fr',   telephone: '06 78 89 90 01', statut: 'actif',   matieres_codes: ['FR'] },
  { _id: oid(), nom: 'Bernard',    prenom: 'Michel',      genre: 'M', email: 'm.bernard@ecole.fr',    telephone: '06 34 56 78 90', statut: 'actif',   matieres_codes: ['HG'] },
  { _id: oid(), nom: 'Lambert',    prenom: 'Christophe',  genre: 'M', email: 'c.lambert@ecole.fr',    telephone: '06 89 90 01 12', statut: 'actif',   matieres_codes: ['HG'] },
  { _id: oid(), nom: 'Johnson',    prenom: 'Claire',      genre: 'F', email: 'c.johnson@ecole.fr',    telephone: '06 45 67 89 01', statut: 'actif',   matieres_codes: ['ANG'] },
  { _id: oid(), nom: 'Petit',      prenom: 'Isabelle',    genre: 'F', email: 'i.petit@ecole.fr',      telephone: '06 90 01 12 23', statut: 'actif',   matieres_codes: ['ANG'] },
  { _id: oid(), nom: 'Garcia',     prenom: 'Elena',       genre: 'F', email: 'e.garcia@ecole.fr',     telephone: '06 56 78 90 12', statut: 'actif',   matieres_codes: ['ESP'] },
  { _id: oid(), nom: 'Fontaine',   prenom: 'Brigitte',    genre: 'F', email: 'b.fontaine@ecole.fr',   telephone: '06 34 56 67 78', statut: 'actif',   matieres_codes: ['ESP'] },
  { _id: oid(), nom: 'Curie',      prenom: 'Pierre',      genre: 'M', email: 'p.curie@ecole.fr',      telephone: '06 67 89 01 23', statut: 'actif',   matieres_codes: ['PC'] },
  { _id: oid(), nom: 'Blanc',      prenom: 'Robert',      genre: 'M', email: 'r.blanc@ecole.fr',      telephone: '06 01 12 23 34', statut: 'actif',   matieres_codes: ['PC'] },
  { _id: oid(), nom: 'Darwin',     prenom: 'Isabelle',    genre: 'F', email: 'i.darwin@ecole.fr',     telephone: '06 78 90 12 34', statut: 'actif',   matieres_codes: ['SVT'] },
  { _id: oid(), nom: 'Garnier',    prenom: 'Valérie',     genre: 'F', email: 'v.garnier@ecole.fr',    telephone: '06 12 34 45 56', statut: 'actif',   matieres_codes: ['SVT'] },
  { _id: oid(), nom: 'Turing',     prenom: 'Paul',        genre: 'M', email: 'p.turing@ecole.fr',     telephone: '06 89 01 23 45', statut: 'actif',   matieres_codes: ['TECH'] },
  { _id: oid(), nom: 'Coubertin',  prenom: 'Marc',        genre: 'M', email: 'm.coubertin@ecole.fr',  telephone: '06 90 12 34 56', statut: 'actif',   matieres_codes: ['EPS'] },
  { _id: oid(), nom: 'Mercier',    prenom: 'Stéphane',    genre: 'M', email: 's.mercier@ecole.fr',    telephone: '06 23 45 56 67', statut: 'actif',   matieres_codes: ['EPS'] },
  { _id: oid(), nom: 'Picasso',    prenom: 'Françoise',   genre: 'F', email: 'f.picasso@ecole.fr',    telephone: '06 01 23 45 67', statut: 'actif',   matieres_codes: ['ARTS'] },
  { _id: oid(), nom: 'Mozart',     prenom: 'Laurent',     genre: 'M', email: 'l.mozart@ecole.fr',     telephone: '06 12 23 34 45', statut: 'actif',   matieres_codes: ['MUS'] },
  { _id: oid(), nom: 'Müller',     prenom: 'Greta',       genre: 'F', email: 'g.muller@ecole.fr',     telephone: '06 23 34 45 56', statut: 'actif',   matieres_codes: ['ALL'] },
  { _id: oid(), nom: 'Caesar',     prenom: 'Antoine',     genre: 'M', email: 'a.caesar@ecole.fr',     telephone: '06 34 45 56 67', statut: 'actif',   matieres_codes: ['LAT'] },
  { _id: oid(), nom: 'Socrate',    prenom: 'Denis',       genre: 'M', email: 'd.socrate@ecole.fr',    telephone: '06 45 56 67 78', statut: 'actif',   matieres_codes: ['PHILO'] },
  { _id: oid(), nom: 'Keynes',     prenom: 'Florence',    genre: 'F', email: 'f.keynes@ecole.fr',     telephone: '06 56 67 78 89', statut: 'actif',   matieres_codes: ['SES'] },
  { _id: oid(), nom: 'Chevalier',  prenom: 'Éric',        genre: 'M', email: 'e.chevalier@ecole.fr',  telephone: '06 45 67 78 89', statut: 'inactif', matieres_codes: ['MATH'] },
];

// index prof par code matière (premier actif)
const profByCode = {};
professeursData.forEach(p => {
  p.matieres_codes.forEach(code => {
    if (!profByCode[code]) profByCode[code] = [];
    profByCode[code].push(p);
  });
});

// ─── NIVEAUX ─────────────────────────────────────────────────
function matIds(codes) {
  return codes.map(c => matiereByCode[c]._id.toString());
}

const niveauxData = [
  { _id: oid(), nom: '6ème',      ordre: 1, description: 'Sixième — entrée au collège',
    matiere_ids: matIds(['MATH','FR','HG','ANG','PC','SVT','TECH','EPS','ARTS','MUS']) },
  { _id: oid(), nom: '5ème',      ordre: 2, description: 'Cinquième',
    matiere_ids: matIds(['MATH','FR','HG','ANG','PC','SVT','TECH','EPS','ARTS','MUS','LAT']) },
  { _id: oid(), nom: '4ème',      ordre: 3, description: 'Quatrième',
    matiere_ids: matIds(['MATH','FR','HG','ANG','ESP','PC','SVT','TECH','EPS','ARTS','MUS','LAT','ALL']) },
  { _id: oid(), nom: '3ème',      ordre: 4, description: 'Troisième — brevet des collèges',
    matiere_ids: matIds(['MATH','FR','HG','ANG','ESP','PC','SVT','TECH','EPS','ARTS','MUS','LAT','ALL']) },
  { _id: oid(), nom: '2nde',      ordre: 5, description: 'Seconde générale et technologique',
    matiere_ids: matIds(['MATH','FR','HG','ANG','ESP','PC','SVT','EPS','ARTS','ALL','SES']) },
  { _id: oid(), nom: '1ère',      ordre: 6, description: 'Première — spécialités',
    matiere_ids: matIds(['MATH','FR','HG','ANG','ESP','PC','SVT','EPS','ALL','SES']) },
  { _id: oid(), nom: 'Terminale', ordre: 7, description: 'Terminale — baccalauréat',
    matiere_ids: matIds(['MATH','FR','HG','ANG','ESP','PC','SVT','EPS','PHILO','SES']) },
];

const matieresByNiveau = {};
niveauxData.forEach(n => {
  matieresByNiveau[n.nom] = n.matiere_ids.map(id =>
    matieresData.find(m => m._id.toString() === id)
  ).filter(Boolean);
});

// ─── ANNÉES SCOLAIRES ────────────────────────────────────────
const anneesData = [
  {
    _id: oid(),
    label: '2023-2024',
    debut: '2023-09-04',
    fin: '2024-07-05',
    statut: 'terminee',
    historique: [
      { action: 'creation',  date: '2023-06-15T10:00:00.000Z', details: 'Année 2023-2024 préparée en juin' },
      { action: 'demarrage', date: '2023-09-04T08:00:00.000Z', details: 'Rentrée scolaire 2023-2024 démarrée' },
      { action: 'cloture',   date: '2024-07-05T17:00:00.000Z', details: 'Clôture de l\'année — résultats bac et brevet enregistrés' },
    ],
  },
  {
    _id: oid(),
    label: '2024-2025',
    debut: '2024-09-02',
    fin: '2025-07-04',
    statut: 'active',
    historique: [
      { action: 'creation',  date: '2024-06-20T10:00:00.000Z', details: 'Année 2024-2025 préparée' },
      { action: 'demarrage', date: '2024-09-02T08:00:00.000Z', details: 'Rentrée scolaire 2024-2025 démarrée' },
    ],
  },
];

// ─── CLASSES ─────────────────────────────────────────────────
const classes2324 = [
  { _id: oid(), nom: '6ème A',      niveau: '6ème',      annee_scolaire: '2023-2024', capacite: 30, salle: 'Salle 101', salle_type: 'fixe' },
  { _id: oid(), nom: '6ème B',      niveau: '6ème',      annee_scolaire: '2023-2024', capacite: 30, salle: 'Salle 102', salle_type: 'fixe' },
  { _id: oid(), nom: '5ème A',      niveau: '5ème',      annee_scolaire: '2023-2024', capacite: 30, salle: 'Salle 201', salle_type: 'fixe' },
  { _id: oid(), nom: '5ème B',      niveau: '5ème',      annee_scolaire: '2023-2024', capacite: 30, salle: 'Salle 202', salle_type: 'fixe' },
  { _id: oid(), nom: '4ème A',      niveau: '4ème',      annee_scolaire: '2023-2024', capacite: 32, salle: 'Salle 203', salle_type: 'variable' },
  { _id: oid(), nom: '3ème A',      niveau: '3ème',      annee_scolaire: '2023-2024', capacite: 30, salle: 'Salle 201', salle_type: 'fixe' },
  { _id: oid(), nom: '2nde 1',      niveau: '2nde',      annee_scolaire: '2023-2024', capacite: 35, salle: 'Salle 202', salle_type: 'variable' },
  { _id: oid(), nom: '1ère S',      niveau: '1ère',      annee_scolaire: '2023-2024', capacite: 32, salle: 'Salle 203', salle_type: 'variable' },
  { _id: oid(), nom: 'Terminale S', niveau: 'Terminale', annee_scolaire: '2023-2024', capacite: 30, salle: 'Salle 103', salle_type: 'variable' },
];

const classes2425 = [
  { _id: oid(), nom: '6ème A',       niveau: '6ème',      annee_scolaire: '2024-2025', capacite: 30, salle: 'Salle 101', salle_type: 'fixe' },
  { _id: oid(), nom: '6ème B',       niveau: '6ème',      annee_scolaire: '2024-2025', capacite: 30, salle: 'Salle 102', salle_type: 'fixe' },
  { _id: oid(), nom: '6ème C',       niveau: '6ème',      annee_scolaire: '2024-2025', capacite: 28, salle: 'Salle 103', salle_type: 'variable' },
  { _id: oid(), nom: '5ème A',       niveau: '5ème',      annee_scolaire: '2024-2025', capacite: 30, salle: 'Salle 201', salle_type: 'fixe' },
  { _id: oid(), nom: '5ème B',       niveau: '5ème',      annee_scolaire: '2024-2025', capacite: 30, salle: 'Salle 202', salle_type: 'fixe' },
  { _id: oid(), nom: '4ème A',       niveau: '4ème',      annee_scolaire: '2024-2025', capacite: 32, salle: 'Salle 203', salle_type: 'variable' },
  { _id: oid(), nom: '4ème B',       niveau: '4ème',      annee_scolaire: '2024-2025', capacite: 32, salle: 'Salle 101', salle_type: 'variable' },
  { _id: oid(), nom: '3ème A',       niveau: '3ème',      annee_scolaire: '2024-2025', capacite: 30, salle: 'Salle 201', salle_type: 'fixe' },
  { _id: oid(), nom: '3ème B',       niveau: '3ème',      annee_scolaire: '2024-2025', capacite: 30, salle: 'Salle 202', salle_type: 'fixe' },
  { _id: oid(), nom: '2nde 1',       niveau: '2nde',      annee_scolaire: '2024-2025', capacite: 35, salle: 'Salle 201', salle_type: 'variable' },
  { _id: oid(), nom: '2nde 2',       niveau: '2nde',      annee_scolaire: '2024-2025', capacite: 35, salle: 'Salle 202', salle_type: 'variable' },
  { _id: oid(), nom: '1ère S',       niveau: '1ère',      annee_scolaire: '2024-2025', capacite: 32, salle: 'Salle 101', salle_type: 'variable' },
  { _id: oid(), nom: '1ère ES',      niveau: '1ère',      annee_scolaire: '2024-2025', capacite: 32, salle: 'Salle 102', salle_type: 'variable' },
  { _id: oid(), nom: 'Terminale S',  niveau: 'Terminale', annee_scolaire: '2024-2025', capacite: 30, salle: 'Salle 103', salle_type: 'variable' },
  { _id: oid(), nom: 'Terminale ES', niveau: 'Terminale', annee_scolaire: '2024-2025', capacite: 30, salle: 'Salle 203', salle_type: 'variable' },
];

const allClasses = [...classes2324, ...classes2425];

// ─── ÉLÈVES ──────────────────────────────────────────────────
function birthYear(niveau, decalage) {
  const base = { '6ème':2012,'5ème':2011,'4ème':2010,'3ème':2009,'2nde':2008,'1ère':2007,'Terminale':2006 };
  return (base[niveau] || 2010) - (decalage || 0);
}

const elevesArr = [];
allClasses.forEach(c => {
  const nb = randInt(22, 29);
  const decalage = c.annee_scolaire === '2023-2024' ? 1 : 0;
  for (let i = 0; i < nb; i++) {
    const g = Math.random() > 0.5 ? 'M' : 'F';
    const prenom = g === 'M' ? pick(prenomM) : pick(prenomF);
    const nom = pick(noms);
    const y = birthYear(c.niveau, decalage);
    const prenomNorm = prenom.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
    elevesArr.push({
      _id: oid(),
      nom, prenom,
      date_naissance: dateStr(y, randInt(1,12), randInt(1,28)),
      genre: g,
      classe_id: c._id.toString(),
      email: `${prenomNorm}${randInt(10,99)}.${nom.toLowerCase()}@eleve.ecole.fr`,
      telephone: `06 ${pad(randInt(10,99))} ${pad(randInt(10,99))} ${pad(randInt(10,99))} ${pad(randInt(10,99))}`,
      statut: 'actif',
    });
  }
});

// ─── PROFILS & NOTES ─────────────────────────────────────────
// Chaque élève a un profil (bon / moyen / difficile) constant
const eleveProfile = {};
elevesArr.forEach(e => {
  const r = Math.random();
  if (r < 0.25)      eleveProfile[e._id.toString()] = { min: 13, max: 19 };
  else if (r < 0.70) eleveProfile[e._id.toString()] = { min: 8,  max: 14 };
  else               eleveProfile[e._id.toString()] = { min: 3,  max: 11 };
});

function genNoteVal(eleveId) {
  const p = eleveProfile[eleveId.toString()];
  const raw = p.min + Math.random() * (p.max - p.min);
  return clamp(Math.round(raw * 2) / 2, 0, 20);
}

const notesArr = [];
allClasses.forEach(c => {
  const elevesClasse = elevesArr.filter(e => e.classe_id === c._id.toString());
  const mats = matieresByNiveau[c.niveau] || [];
  const matsSelect = mats.slice().sort(() => Math.random()-0.5).slice(0, Math.min(mats.length, randInt(7,10)));
  const trimestres = c.annee_scolaire === '2023-2024' ? [1,2,3] : [1,2];
  const [yBase] = c.annee_scolaire.split('-').map(Number);
  const dateFen = {
    1: [yBase,   9, 12],
    2: [yBase+1, 1,  3],
    3: [yBase+1, 4,  6],
  };

  elevesClasse.forEach(e => {
    trimestres.forEach(tri => {
      matsSelect.forEach(m => {
        const nbNotes = randInt(1, 3);
        for (let i = 0; i < nbNotes; i++) {
          const [y, mMin, mMax] = dateFen[tri];
          notesArr.push({
            _id: oid(),
            eleve_id: e._id.toString(),
            matiere_id: m._id.toString(),
            valeur: genNoteVal(e._id),
            trimestre: tri,
            type: Math.random() > 0.5 ? 'ds' : 'evaluation',
            date: dateStr(y, randInt(mMin, mMax), randInt(1,28)),
            commentaire: pick(commentaires) || undefined,
            annee_scolaire: c.annee_scolaire,
          });
        }
      });
    });
  });
});

// ─── CRÉNEAUX ────────────────────────────────────────────────
const jours = ['Lundi','Mardi','Mercredi','Jeudi','Vendredi'];
const heures = ['08:00','09:00','10:00','11:00','14:00','15:00','16:00'];

function salleSpeciale(code, defaultSalle) {
  const map = { PC:'Labo Physique', SVT:'Labo SVT', TECH:'Salle Info 1', EPS:'Gymnase', ARTS:'Salle Arts', MUS:'Salle Arts' };
  return map[code] || defaultSalle;
}

function formatProf(code) {
  const profs = profByCode[code];
  if (!profs || !profs.length) return '';
  const p = profs.find(x => x.statut === 'actif') || profs[0];
  return `${p.genre === 'F' ? 'Mme' : 'M.'} ${p.prenom} ${p.nom}`;
}

const creneauxArr = [];
classes2425.forEach(c => {
  const mats = matieresByNiveau[c.niveau] || [];
  const matsSelect = mats.slice().sort(()=>Math.random()-0.5).slice(0, Math.min(mats.length, randInt(8,11)));
  const occ = new Set();

  matsSelect.forEach(m => {
    const coefEntry = m.coefficients.find(co => co.niveau === c.niveau);
    const coef = coefEntry ? coefEntry.coefficient : 2;
    const nbC = clamp(Math.floor(coef / 1.5), 1, 4);

    for (let i = 0; i < nbC; i++) {
      let j, hd, hf, att = 0;
      do {
        j = pick(jours);
        hd = pick(heures);
        const dur = m.code === 'EPS' ? 2 : (Math.random() > 0.7 ? 2 : 1);
        hf = `${(parseInt(hd)+dur).toString().padStart(2,'0')}:00`;
        att++;
      } while (occ.has(`${j}-${hd}`) && att < 30);
      if (att >= 30) continue;
      occ.add(`${j}-${hd}`);

      const sn = c.salle_type === 'variable' ? salleSpeciale(m.code, c.salle) : c.salle;
      creneauxArr.push({
        _id: oid(),
        classe_id: c._id.toString(),
        matiere_id: m._id.toString(),
        matiere_nom: m.nom,
        matiere_couleur: m.couleur,
        jour: j, heure_debut: hd, heure_fin: hf,
        salle: sn,
        enseignant: formatProf(m.code),
      });
    }
  });
});

// ─── PÉRIODES D'ÉVALUATION ───────────────────────────────────
const periodesData = [
  // 2023-2024 : toutes terminées
  { _id: oid(), trimestre: 1, type: 'ds',         annee_scolaire: '2023-2024', date_debut: '2023-10-02', date_fin: '2023-10-20', terminee: true },
  { _id: oid(), trimestre: 1, type: 'evaluation', annee_scolaire: '2023-2024', date_debut: '2023-09-18', date_fin: '2023-10-27', terminee: true },
  { _id: oid(), trimestre: 2, type: 'ds',         annee_scolaire: '2023-2024', date_debut: '2024-01-08', date_fin: '2024-01-26', terminee: true },
  { _id: oid(), trimestre: 2, type: 'evaluation', annee_scolaire: '2023-2024', date_debut: '2023-12-04', date_fin: '2024-02-02', terminee: true },
  { _id: oid(), trimestre: 3, type: 'ds',         annee_scolaire: '2023-2024', date_debut: '2024-04-22', date_fin: '2024-05-10', terminee: true },
  { _id: oid(), trimestre: 3, type: 'evaluation', annee_scolaire: '2023-2024', date_debut: '2024-04-08', date_fin: '2024-05-31', terminee: true },
  // 2024-2025 : T1 terminé, T2 en cours
  { _id: oid(), trimestre: 1, type: 'ds',         annee_scolaire: '2024-2025', date_debut: '2024-10-07', date_fin: '2024-10-25', terminee: true },
  { _id: oid(), trimestre: 1, type: 'evaluation', annee_scolaire: '2024-2025', date_debut: '2024-09-16', date_fin: '2024-11-08', terminee: true },
  { _id: oid(), trimestre: 2, type: 'ds',         annee_scolaire: '2024-2025', date_debut: '2025-01-06', date_fin: '2025-01-24', terminee: false },
  { _id: oid(), trimestre: 2, type: 'evaluation', annee_scolaire: '2024-2025', date_debut: '2024-12-02', date_fin: '2025-02-07', terminee: false },
];

// ─── TEACHER ASSIGNMENTS (2024-2025 uniquement) ───────────────
const assignmentsArr = [];
const assignIdx = new Set();

classes2425.forEach(c => {
  const mats = matieresByNiveau[c.niveau] || [];
  mats.forEach(m => {
    const key = `${c._id}-${m._id}`;
    if (assignIdx.has(key)) return;
    assignIdx.add(key);
    const profs = profByCode[m.code];
    if (!profs || !profs.length) return;
    const profActif = profs.find(p => p.statut === 'actif');
    if (!profActif) return;
    assignmentsArr.push({
      _id: oid(),
      professeur_id: profActif._id.toString(),
      classe_id: c._id.toString(),
      matiere_id: m._id.toString(),
    });
  });
});

// ─── INSERTION ───────────────────────────────────────────────
print('\n=== SEEDING GestionÉcole ===\n');

db.salles.insertMany(sallesData);
print(`✓ ${sallesData.length} salles`);

db.matieres.insertMany(matieresData);
print(`✓ ${matieresData.length} matières`);

db.niveaux.insertMany(niveauxData);
print(`✓ ${niveauxData.length} niveaux`);

const profDocs = professeursData.map(p => {
  const doc = Object.assign({}, p);
  delete doc.matieres_codes;
  return doc;
});
db.professeurs.insertMany(profDocs);
print(`✓ ${profDocs.length} professeurs`);

db.annees.insertMany(anneesData);
print(`✓ ${anneesData.length} années (2023-2024 terminée + 2024-2025 active)`);

db.classes.insertMany(allClasses);
print(`✓ ${allClasses.length} classes (${classes2324.length} en 2023-2024 + ${classes2425.length} en 2024-2025)`);

db.eleves.insertMany(elevesArr);
print(`✓ ${elevesArr.length} élèves`);

db.notes.insertMany(notesArr);
print(`✓ ${notesArr.length} notes`);

db.creneaux.insertMany(creneauxArr);
print(`✓ ${creneauxArr.length} créneaux`);

db.periodesevaluations.insertMany(periodesData);
print(`✓ ${periodesData.length} périodes d'évaluation`);

db.teacherassignments.insertMany(assignmentsArr);
print(`✓ ${assignmentsArr.length} affectations professeurs`);

print('\n=== RÉCAPITULATIF ===');
print(`Élèves     : ${elevesArr.length}`);
print(`Notes      : ${notesArr.length}`);
print(`Créneaux   : ${creneauxArr.length}`);
print(`Assignments: ${assignmentsArr.length}`);
print('\n=== SEEDING TERMINÉ ✓ ===\n');
