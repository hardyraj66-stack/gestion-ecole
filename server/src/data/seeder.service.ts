import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { InjectModel, InjectConnection } from '@nestjs/mongoose';
import { Model, Connection } from 'mongoose';
import { Classe } from '../classes/classe.schema';
import { Eleve } from '../eleves/eleve.schema';
import { Matiere } from '../matieres/matiere.schema';
import { Note } from '../notes/note.schema';
import { Creneau } from '../planning/creneau.schema';
import { Salle } from '../salles/salle.schema';
import { AnneeScolaire } from '../annees/annee.schema';
import { Niveau } from '../niveaux/niveau.schema';
import { Professeur } from '../professeurs/professeur.schema';
import { TeacherAssignment } from '../teacher-assignments/teacher-assignment.schema';
import { PeriodeEvaluation } from '../periodes/periode.schema';

// ============ HELPERS ============
function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }
function pad(n: number): string { return n.toString().padStart(2, '0'); }
function randInt(min: number, max: number) { return min + Math.floor(Math.random() * (max - min + 1)); }

const prenomM = ['Lucas','Hugo','Louis','Gabriel','Raphaël','Arthur','Jules','Adam','Léo','Nathan','Ethan','Mathis','Paul','Maxime','Alexandre','Thomas','Antoine','Baptiste','Clément','Victor','Théo','Nicolas','Julien','Pierre','Romain','Quentin','Axel','Dylan','Enzo','Mathéo'];
const prenomF = ['Emma','Léa','Chloé','Manon','Camille','Sarah','Louise','Jade','Zoé','Lina','Alice','Julie','Margot','Clara','Inès','Anaïs','Léonie','Marie','Lucie','Charlotte','Eva','Romane','Pauline','Marine','Océane','Ambre','Juliette','Lisa','Laura','Mathilde'];
const noms = ['Martin','Bernard','Thomas','Petit','Robert','Richard','Durand','Dubois','Moreau','Laurent','Simon','Michel','Lefebvre','Leroy','Roux','David','Bertrand','Morel','Fournier','Girard','Bonnet','Dupont','Lambert','Fontaine','Rousseau','Vincent','Muller','Lefevre','Faure','Andre','Mercier','Blanc','Guerin','Boyer','Garnier','Chevalier','François','Legrand','Gauthier','Garcia'];

type JourSemaine = 'Lundi' | 'Mardi' | 'Mercredi' | 'Jeudi' | 'Vendredi' | 'Samedi';

const enseignants: Record<string, string> = {
  'MATH':'M. Dupont','FR':'Mme Martin','HG':'M. Bernard','ANG':'Mme Johnson',
  'ESP':'Mme Garcia','PC':'M. Curie','SVT':'Mme Darwin','TECH':'M. Turing',
  'EPS':'M. Coubertin','ARTS':'Mme Picasso','MUS':'M. Mozart','ALL':'Mme Müller',
  'LAT':'M. Caesar','PHILO':'M. Socrate','SES':'Mme Keynes',
};

// ============ RAW DATA ============
const sallesData = [
  { nom: 'Salle 101', capacite: 30, description: 'Salle de cours standard', type: 'standard' },
  { nom: 'Salle 102', capacite: 30, description: 'Salle de cours standard', type: 'standard' },
  { nom: 'Salle 103', capacite: 25, description: 'Petite salle de cours', type: 'standard' },
  { nom: 'Salle 201', capacite: 35, description: 'Grande salle de cours', type: 'standard' },
  { nom: 'Salle 202', capacite: 30, description: 'Salle de cours standard', type: 'standard' },
  { nom: 'Labo Physique', capacite: 24, description: 'Laboratoire de physique-chimie', type: 'laboratoire' },
  { nom: 'Labo SVT', capacite: 24, description: 'Laboratoire de sciences de la vie', type: 'laboratoire' },
  { nom: 'Salle Info 1', capacite: 20, description: 'Salle informatique avec 20 postes', type: 'informatique' },
  { nom: 'Salle Info 2', capacite: 18, description: 'Salle informatique avec 18 postes', type: 'informatique' },
  { nom: 'Gymnase', capacite: 60, description: 'Gymnase principal', type: 'sport' },
  { nom: 'Salle Arts', capacite: 25, description: "Salle d'arts plastiques", type: 'arts' },
  { nom: 'Salle Musique', capacite: 30, description: 'Salle de musique', type: 'arts' },
];

const classesData = [
  { nom: '6ème A', niveau: '6ème', annee_scolaire: '2024-2025', capacite: 30, salle: 'Salle 101', salle_type: 'fixe' },
  { nom: '6ème B', niveau: '6ème', annee_scolaire: '2024-2025', capacite: 30, salle: 'Salle 102', salle_type: 'fixe' },
  { nom: '6ème C', niveau: '6ème', annee_scolaire: '2024-2025', capacite: 28, salle: 'Salle 103', salle_type: 'variable' },
  { nom: '5ème A', niveau: '5ème', annee_scolaire: '2024-2025', capacite: 30, salle: 'Salle 201', salle_type: 'fixe' },
  { nom: '5ème B', niveau: '5ème', annee_scolaire: '2024-2025', capacite: 30, salle: 'Salle 202', salle_type: 'fixe' },
  { nom: '4ème A', niveau: '4ème', annee_scolaire: '2024-2025', capacite: 32, salle: 'Salle 101', salle_type: 'variable' },
  { nom: '4ème B', niveau: '4ème', annee_scolaire: '2024-2025', capacite: 32, salle: 'Salle 102', salle_type: 'variable' },
  { nom: '3ème A', niveau: '3ème', annee_scolaire: '2024-2025', capacite: 30, salle: 'Salle 201', salle_type: 'fixe' },
  { nom: '3ème B', niveau: '3ème', annee_scolaire: '2024-2025', capacite: 30, salle: 'Salle 202', salle_type: 'fixe' },
  { nom: '2nde 1', niveau: '2nde', annee_scolaire: '2024-2025', capacite: 35, salle: 'Salle 201', salle_type: 'variable' },
  { nom: '2nde 2', niveau: '2nde', annee_scolaire: '2024-2025', capacite: 35, salle: 'Salle 202', salle_type: 'variable' },
  { nom: '1ère S', niveau: '1ère', annee_scolaire: '2024-2025', capacite: 32, salle: 'Salle 101', salle_type: 'variable' },
  { nom: '1ère ES', niveau: '1ère', annee_scolaire: '2024-2025', capacite: 32, salle: 'Salle 102', salle_type: 'variable' },
  { nom: 'Terminale S', niveau: 'Terminale', annee_scolaire: '2024-2025', capacite: 30, salle: 'Salle 103', salle_type: 'variable' },
  { nom: 'Terminale ES', niveau: 'Terminale', annee_scolaire: '2024-2025', capacite: 30, salle: 'Salle 201', salle_type: 'variable' },
];

const niveaux = ['6ème', '5ème', '4ème', '3ème', '2nde', '1ère', 'Terminale'];
const matieresData = [
  { nom: 'Mathématiques', code: 'MATH', description: 'Algèbre, géométrie, analyse', couleur: '#2563eb',
    coefficients: niveaux.map(n => ({ niveau: n, coefficient: n === '2nde' || n === '1ère' || n === 'Terminale' ? 5 : 4 })) },
  { nom: 'Français', code: 'FR', description: 'Grammaire, littérature, expression écrite', couleur: '#7c3aed',
    coefficients: niveaux.map(n => ({ niveau: n, coefficient: n === 'Terminale' ? 3 : 4 })) },
  { nom: 'Histoire-Géographie', code: 'HG', description: 'Histoire et géographie', couleur: '#d97706',
    coefficients: niveaux.map(n => ({ niveau: n, coefficient: n === '2nde' || n === '1ère' || n === 'Terminale' ? 4 : 3 })) },
  { nom: 'Anglais', code: 'ANG', description: 'Langue vivante 1', couleur: '#dc2626',
    coefficients: niveaux.map(n => ({ niveau: n, coefficient: 3 })) },
  { nom: 'Espagnol', code: 'ESP', description: 'Langue vivante 2', couleur: '#db2777',
    coefficients: ['4ème','3ème','2nde','1ère','Terminale'].map(n => ({ niveau: n, coefficient: 2 })) },
  { nom: 'Physique-Chimie', code: 'PC', description: 'Sciences physiques et chimiques', couleur: '#0891b2',
    coefficients: niveaux.map(n => ({ niveau: n, coefficient: n === '2nde' || n === '1ère' || n === 'Terminale' ? 4 : 3 })) },
  { nom: 'SVT', code: 'SVT', description: 'Sciences de la vie et de la terre', couleur: '#16a34a',
    coefficients: niveaux.map(n => ({ niveau: n, coefficient: n === 'Terminale' ? 3 : 2 })) },
  { nom: 'Technologie', code: 'TECH', description: 'Technologie et informatique', couleur: '#475569',
    coefficients: ['6ème','5ème','4ème','3ème'].map(n => ({ niveau: n, coefficient: 2 })) },
  { nom: 'EPS', code: 'EPS', description: 'Éducation physique et sportive', couleur: '#ea580c',
    coefficients: niveaux.map(n => ({ niveau: n, coefficient: 2 })) },
  { nom: 'Arts Plastiques', code: 'ARTS', description: 'Arts visuels et plastiques', couleur: '#a855f7',
    coefficients: niveaux.map(n => ({ niveau: n, coefficient: 1 })) },
  { nom: 'Musique', code: 'MUS', description: 'Éducation musicale', couleur: '#ec4899',
    coefficients: ['6ème','5ème','4ème','3ème'].map(n => ({ niveau: n, coefficient: 1 })) },
  { nom: 'Allemand', code: 'ALL', description: 'Langue vivante 2', couleur: '#f59e0b',
    coefficients: ['4ème','3ème','2nde','1ère','Terminale'].map(n => ({ niveau: n, coefficient: 2 })) },
  { nom: 'Latin', code: 'LAT', description: 'Langue ancienne', couleur: '#6366f1',
    coefficients: ['5ème','4ème','3ème'].map(n => ({ niveau: n, coefficient: 2 })) },
  { nom: 'Philosophie', code: 'PHILO', description: 'Philosophie (Terminale)', couleur: '#8b5cf6',
    coefficients: [{ niveau: 'Terminale', coefficient: 7 }] },
  { nom: 'SES', code: 'SES', description: 'Sciences économiques et sociales', couleur: '#14b8a6',
    coefficients: ['2nde','1ère','Terminale'].map(n => ({ niveau: n, coefficient: 3 })) },
];

function birthYear(niveau: string): number {
  const m: Record<string, number> = { '6ème':2013,'5ème':2012,'4ème':2011,'3ème':2010,'2nde':2009,'1ère':2008,'Terminale':2007 };
  return m[niveau] || 2010;
}

@Injectable()
export class SeederService implements OnModuleInit {
  private readonly logger = new Logger('Seeder');

  constructor(
    @InjectModel(Salle.name) private salleModel: Model<Salle>,
    @InjectModel(Classe.name) private classeModel: Model<Classe>,
    @InjectModel(Matiere.name) private matiereModel: Model<Matiere>,
    @InjectModel(Eleve.name) private eleveModel: Model<Eleve>,
    @InjectModel(Note.name) private noteModel: Model<Note>,
    @InjectModel(Creneau.name) private creneauModel: Model<Creneau>,
    @InjectModel(AnneeScolaire.name) private anneeModel: Model<AnneeScolaire>,
    @InjectModel(Niveau.name) private niveauModel: Model<Niveau>,
    @InjectModel(Professeur.name) private professeurModel: Model<Professeur>,
    @InjectModel(TeacherAssignment.name) private assignmentModel: Model<TeacherAssignment>,
    @InjectModel(PeriodeEvaluation.name) private periodeModel: Model<PeriodeEvaluation>,
    @InjectConnection() private connection: Connection,
  ) {}

  /** Réinitialise complètement la base puis régénère un jeu de données complet (dev/E2E). */
  async reset() {
    const collections = await this.connection.db.collections();
    for (const c of collections) {
      await c.deleteMany({});
    }
    this.logger.log('Reset : toutes les collections vidées, re-seeding...');
    await this.seed();
    this.logger.log('Reset : seeding complet terminé');
  }

  async onModuleInit() {
    const count = await this.salleModel.countDocuments();
    if (count > 0) {
      this.logger.log('Base déjà peuplée, seeding ignoré');
      return;
    }
    this.logger.log('Base vide, lancement du seeding...');
    await this.seed();
    this.logger.log('Seeding terminé ✓');
  }

  async seed() {
    // 1. Année scolaire (créée en premier pour associer toutes les entités)
    const now = new Date().toISOString();
    const annee = await this.anneeModel.create({
      label: '2024-2025',
      debut_planifie: '2024-09-02',
      fin_planifie:   '2025-07-05',
      debut_reel:     '2024-09-02',
      fin_reel:       null,
      migration_effectuee: false,
      statut: 'active',
      historique: [
        { action: 'creation', date: now, details: 'Année scolaire 2024-2025 créée par le seeder' },
        { action: 'demarrage', date: now, details: 'Année scolaire 2024-2025 démarrée automatiquement' },
      ],
    });
    const anneeId = (annee as any)._id.toString();
    this.logger.log('  1 année scolaire (2024-2025 active)');

    // 2. Salles (avec anneeScolaireId)
    const salles = await this.salleModel.insertMany(sallesData.map(s => ({ ...s, anneeScolaireId: anneeId })));
    this.logger.log(`  ${salles.length} salles`);

    // 3. Matières (avec anneeScolaireId)
    const matieres = await this.matiereModel.insertMany(matieresData.map(m => ({ ...m, anneeScolaireId: anneeId })));
    this.logger.log(`  ${matieres.length} matières`);

    // 4. Niveaux (avec anneeScolaireId + matiere_ids dérivés des coefficients)
    const niveauxDocs = niveaux.map((nom, idx) => {
      const matiereIds = matieres
        .filter(m => ((m as any).coefficients || []).some((c: any) => c.niveau === nom))
        .map(m => (m as any)._id.toString());
      return { nom, ordre: idx, description: '', matiere_ids: matiereIds, anneeScolaireId: anneeId };
    });
    const niveauxCrees = await this.niveauModel.insertMany(niveauxDocs);
    this.logger.log(`  ${niveauxCrees.length} niveaux`);

    // 5. Classes (avec anneeScolaireId)
    const classesWithAnnee = classesData.map(c => ({ ...c, anneeScolaireId: anneeId }));
    const classes = await this.classeModel.insertMany(classesWithAnnee);
    this.logger.log(`  ${classes.length} classes`);

    // 5. Élèves avec inscriptions[]
    const elevesArr: any[] = [];
    for (const c of classes) {
      const nb = randInt(22, 28);
      for (let i = 0; i < nb; i++) {
        const g = Math.random() > 0.5 ? 'M' : 'F';
        const prenom = g === 'M' ? pick(prenomM) : pick(prenomF);
        const nom = pick(noms);
        const y = birthYear(c.niveau);
        const classeId = (c as any)._id.toString();
        elevesArr.push({
          nom, prenom,
          date_naissance: `${y}-${pad(randInt(1,12))}-${pad(randInt(1,28))}`,
          genre: g,
          classe_id: classeId,
          inscriptions: [{ classeId, status: 'active', anneeScolaireId: anneeId, ordre: 1 }],
          email: `${prenom.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'')}.${nom.toLowerCase()}@ecole.fr`,
          telephone: `06 ${pad(randInt(10,99))} ${pad(randInt(10,99))} ${pad(randInt(10,99))} ${pad(randInt(10,99))}`,
        });
      }
    }
    const eleves = await this.eleveModel.insertMany(elevesArr);
    this.logger.log(`  ${eleves.length} élèves`);

    // 6. Notes — 3 trimestres complets (DS + évaluation par matière du niveau)
    const niveauNoms = niveaux; // liste globale des niveaux
    const matieresParNiveau = new Map<string, any[]>();
    for (const n of niveauNoms) {
      matieresParNiveau.set(n, matieres.filter(m => ((m as any).coefficients || []).some((c: any) => c.niveau === n)));
    }
    const classeNiveauMap = new Map(classes.map(c => [(c as any)._id.toString(), (c as any).niveau]));
    const datesParTrim: Record<number, { ds: string; evaluation: string }> = {
      1: { ds: '2024-10-25', evaluation: '2024-11-15' },
      2: { ds: '2025-03-14', evaluation: '2025-03-28' },
      3: { ds: '2025-06-20', evaluation: '2025-07-04' },
    };
    const notesArr: any[] = [];
    for (const e of eleves) {
      const niveau = classeNiveauMap.get((e as any).classe_id);
      const matsNiveau = matieresParNiveau.get(niveau as string) || [];
      const base = 8 + Math.random() * 9; // profil de l'élève
      for (const m of matsNiveau) {
        for (const trim of [1, 2, 3]) {
          for (const type of ['ds', 'evaluation'] as const) {
            const v = Math.round(Math.min(20, Math.max(0, base + (Math.random()-0.5)*5)) * 2) / 2;
            notesArr.push({
              eleve_id: (e as any)._id.toString(),
              matiere_id: (m as any)._id.toString(),
              valeur: v,
              trimestre: trim,
              type,
              date: datesParTrim[trim][type],
              annee_scolaire: annee.label,
              anneeScolaireId: anneeId,
              annulee: false,
              commentaire: Math.random()>0.85 ? pick(['Bon travail','Peut mieux faire','Excellent','En progrès','Efforts à fournir']) : '',
            });
          }
        }
      }
    }
    // Insertion par batch pour éviter les gros payloads
    let nbNotes = 0;
    for (let i = 0; i < notesArr.length; i += 2000) {
      await this.noteModel.insertMany(notesArr.slice(i, i + 2000));
      nbNotes += Math.min(2000, notesArr.length - i);
    }
    this.logger.log(`  ${nbNotes} notes (3 trimestres)`);

    // 7. Créneaux
    const creneauxArr: any[] = [];
    const jours: JourSemaine[] = ['Lundi','Mardi','Mercredi','Jeudi','Vendredi'];
    const heuresDebut = ['08:00','09:00','10:00','11:00','14:00','15:00','16:00'];
    const stdSalles = sallesData.filter(s => s.type === 'standard');

    for (const c of classes) {
      const mats = [...matieres].sort(()=>Math.random()-0.5).slice(0, randInt(8,11));
      const occ = new Set<string>();
      for (const m of mats) {
        const coef = (m as any).coefficients?.length > 0 ? (m as any).coefficients[0].coefficient : ((m as any).coefficient ?? 2);
        const nb = Math.min(4, Math.max(1, Math.floor(coef/1.5)));
        for (let i = 0; i < nb; i++) {
          let att = 0, j: JourSemaine, hd: string, hf: string;
          do {
            j = pick(jours);
            hd = pick(heuresDebut);
            const dur = m.code === 'EPS' ? 2 : (Math.random()>0.7?2:1);
            hf = `${(parseInt(hd)+dur).toString().padStart(2,'0')}:00`;
            att++;
          } while (occ.has(`${j!}-${hd!}`) && att < 30);
          if (att >= 30) continue;
          occ.add(`${j!}-${hd!}`);

          let sn = c.salle;
          if (c.salle_type === 'variable') {
            if (m.code==='PC') sn='Labo Physique';
            else if (m.code==='SVT') sn='Labo SVT';
            else if (m.code==='TECH') sn='Salle Info 1';
            else if (m.code==='EPS') sn='Gymnase';
            else if (m.code==='ARTS') sn='Salle Arts';
            else if (m.code==='MUS') sn='Salle Musique';
            else sn = pick(stdSalles).nom;
          }

          creneauxArr.push({
            classe_id: (c as any)._id.toString(),
            matiere_id: (m as any)._id.toString(),
            matiere_nom: m.nom,
            matiere_couleur: m.couleur || '#2563eb',
            jour: j!, heure_debut: hd!, heure_fin: hf!,
            salle: sn,
            enseignant: enseignants[m.code] || '',
          });
        }
      }
    }
    const creneaux = await this.creneauModel.insertMany(creneauxArr);
    this.logger.log(`  ${creneaux.length} créneaux`);

    // 8. Professeurs — un par matière
    const profsArr = matieres.map((m: any, i: number) => {
      const g = i % 2 === 0 ? 'M' : 'F';
      const prenom = g === 'M' ? pick(prenomM) : pick(prenomF);
      const nom = pick(noms);
      return {
        nom, prenom, genre: g, statut: 'actif',
        email: `${prenom.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'')}.${nom.toLowerCase()}.prof@ecole.fr`,
        telephone: `06 ${pad(randInt(10,99))} ${pad(randInt(10,99))} ${pad(randInt(10,99))} ${pad(randInt(10,99))}`,
      };
    });
    const profs = await this.professeurModel.insertMany(profsArr);
    const profParMatiere = new Map<string, string>();
    matieres.forEach((m: any, i: number) => profParMatiere.set(m._id.toString(), (profs[i] as any)._id.toString()));
    this.logger.log(`  ${profs.length} professeurs`);

    // 9. Affectations — chaque (classe, matière) du planning reçoit le prof de la matière
    const pairesVues = new Set<string>();
    const assignArr: any[] = [];
    for (const cr of creneaux) {
      const key = `${(cr as any).classe_id}::${(cr as any).matiere_id}`;
      if (pairesVues.has(key)) continue;
      pairesVues.add(key);
      const profId = profParMatiere.get((cr as any).matiere_id);
      if (!profId) continue;
      assignArr.push({ professeur_id: profId, classe_id: (cr as any).classe_id, matiere_id: (cr as any).matiere_id });
    }
    if (assignArr.length > 0) await this.assignmentModel.insertMany(assignArr);
    this.logger.log(`  ${assignArr.length} affectations professeurs`);

    // 10. Périodes d'évaluation — 6 périodes, toutes terminées (fin d'année)
    await this.periodeModel.insertMany([
      { trimestre: 1, type: 'ds',         anneeScolaireId: anneeId, date_debut: '2024-10-01', date_fin: '2024-10-25', terminee: true },
      { trimestre: 1, type: 'evaluation', anneeScolaireId: anneeId, date_debut: '2024-11-04', date_fin: '2024-11-15', terminee: true },
      { trimestre: 2, type: 'ds',         anneeScolaireId: anneeId, date_debut: '2025-03-03', date_fin: '2025-03-14', terminee: true },
      { trimestre: 2, type: 'evaluation', anneeScolaireId: anneeId, date_debut: '2025-03-24', date_fin: '2025-03-28', terminee: true },
      { trimestre: 3, type: 'ds',         anneeScolaireId: anneeId, date_debut: '2025-06-16', date_fin: '2025-06-20', terminee: true },
      { trimestre: 3, type: 'evaluation', anneeScolaireId: anneeId, date_debut: '2025-06-30', date_fin: '2025-07-04', terminee: true },
    ]);
    this.logger.log('  6 périodes (toutes terminées)');
  }
}
