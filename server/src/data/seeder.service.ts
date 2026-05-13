import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Classe } from '../classes/classe.schema';
import { Eleve } from '../eleves/eleve.schema';
import { Matiere } from '../matieres/matiere.schema';
import { Note } from '../notes/note.schema';
import { Creneau } from '../planning/creneau.schema';
import { Salle } from '../salles/salle.schema';
import { AnneeScolaire } from '../annees/annee.schema';

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

const matieresData = [
  { nom: 'Mathématiques', code: 'MATH', coefficient: 4, description: 'Algèbre, géométrie, analyse', couleur: '#2563eb' },
  { nom: 'Français', code: 'FR', coefficient: 4, description: 'Grammaire, littérature, expression écrite', couleur: '#7c3aed' },
  { nom: 'Histoire-Géographie', code: 'HG', coefficient: 3, description: 'Histoire et géographie', couleur: '#d97706' },
  { nom: 'Anglais', code: 'ANG', coefficient: 3, description: 'Langue vivante 1', couleur: '#dc2626' },
  { nom: 'Espagnol', code: 'ESP', coefficient: 2, description: 'Langue vivante 2', couleur: '#db2777' },
  { nom: 'Physique-Chimie', code: 'PC', coefficient: 3, description: 'Sciences physiques et chimiques', couleur: '#0891b2' },
  { nom: 'SVT', code: 'SVT', coefficient: 2, description: 'Sciences de la vie et de la terre', couleur: '#16a34a' },
  { nom: 'Technologie', code: 'TECH', coefficient: 2, description: 'Technologie et informatique', couleur: '#475569' },
  { nom: 'EPS', code: 'EPS', coefficient: 2, description: 'Éducation physique et sportive', couleur: '#ea580c' },
  { nom: 'Arts Plastiques', code: 'ARTS', coefficient: 1, description: 'Arts visuels et plastiques', couleur: '#a855f7' },
  { nom: 'Musique', code: 'MUS', coefficient: 1, description: 'Éducation musicale', couleur: '#ec4899' },
  { nom: 'Allemand', code: 'ALL', coefficient: 2, description: 'Langue vivante 2', couleur: '#f59e0b' },
  { nom: 'Latin', code: 'LAT', coefficient: 2, description: 'Langue ancienne', couleur: '#6366f1' },
  { nom: 'Philosophie', code: 'PHILO', coefficient: 4, description: 'Philosophie (Terminale)', couleur: '#8b5cf6' },
  { nom: 'SES', code: 'SES', coefficient: 3, description: 'Sciences économiques et sociales', couleur: '#14b8a6' },
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
  ) {}

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
    // 1. Salles
    const salles = await this.salleModel.insertMany(sallesData);
    this.logger.log(`  ${salles.length} salles`);

    // 2. Matières
    const matieres = await this.matiereModel.insertMany(matieresData);
    this.logger.log(`  ${matieres.length} matières`);

    // 3. Classes
    const classes = await this.classeModel.insertMany(classesData);
    this.logger.log(`  ${classes.length} classes`);

    // 4. Élèves
    const elevesArr: any[] = [];
    for (const c of classes) {
      const nb = randInt(22, 28);
      for (let i = 0; i < nb; i++) {
        const g = Math.random() > 0.5 ? 'M' : 'F';
        const prenom = g === 'M' ? pick(prenomM) : pick(prenomF);
        const nom = pick(noms);
        const y = birthYear(c.niveau);
        elevesArr.push({
          nom, prenom,
          date_naissance: `${y}-${pad(randInt(1,12))}-${pad(randInt(1,28))}`,
          genre: g,
          classe_id: (c as any)._id.toString(),
          email: `${prenom.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'')}.${nom.toLowerCase()}@ecole.fr`,
          telephone: `06 ${pad(randInt(10,99))} ${pad(randInt(10,99))} ${pad(randInt(10,99))} ${pad(randInt(10,99))}`,
        });
      }
    }
    const eleves = await this.eleveModel.insertMany(elevesArr);
    this.logger.log(`  ${eleves.length} élèves`);

    // 5. Notes
    const notesArr: any[] = [];
    for (const e of eleves) {
      const mats = [...matieres].sort(() => Math.random()-0.5).slice(0, randInt(6,9));
      for (const m of mats) {
        const nb = randInt(2,4);
        for (let i = 0; i < nb; i++) {
          const base = 8 + Math.random()*10;
          const v = Math.round(Math.min(20, Math.max(0, base + (Math.random()-0.5)*4)) * 2) / 2;
          notesArr.push({
            eleve_id: (e as any)._id.toString(),
            matiere_id: (m as any)._id.toString(),
            valeur: v,
            trimestre: 1,
            date: `2024-${pad(randInt(9,11))}-${pad(randInt(1,28))}`,
            commentaire: Math.random()>0.7 ? pick(['Bon travail','Peut mieux faire','Excellent','En progrès','Efforts à fournir']) : undefined,
          });
        }
      }
    }
    const notes = await this.noteModel.insertMany(notesArr);
    this.logger.log(`  ${notes.length} notes`);

    // 6. Créneaux
    const creneauxArr: any[] = [];
    const jours: JourSemaine[] = ['Lundi','Mardi','Mercredi','Jeudi','Vendredi'];
    const heuresDebut = ['08:00','09:00','10:00','11:00','14:00','15:00','16:00'];
    const stdSalles = sallesData.filter(s => s.type === 'standard');

    for (const c of classes) {
      const mats = [...matieres].sort(()=>Math.random()-0.5).slice(0, randInt(8,11));
      const occ = new Set<string>();
      for (const m of mats) {
        const nb = Math.min(4, Math.max(1, Math.floor(m.coefficient/1.5)));
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

    // 7. Année scolaire active
    const now = new Date().toISOString();
    await this.anneeModel.create({
      label: '2024-2025',
      debut: '2024-09-02',
      fin: '2025-07-05',
      statut: 'active',
      historique: [
        { action: 'creation', date: now, details: 'Année scolaire 2024-2025 créée par le seeder' },
        { action: 'demarrage', date: now, details: 'Année scolaire 2024-2025 démarrée automatiquement' },
      ],
    });
    this.logger.log('  1 année scolaire (2024-2025 active)');
  }
}
