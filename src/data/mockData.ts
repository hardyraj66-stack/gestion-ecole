import { Classe, Eleve, Matiere, Note, Creneau, Salle, JourSemaine, AnneeScolaire } from '../types';

// ============ SALLES ============
const defaultSalleFields = { equipements: [] as any[], accessible_pmr: false, batiment: '', etage: '' };

export const mockSalles: Salle[] = [
  { id: 'salle-1', nom: 'Salle 101', capacite: 30, description: 'Salle de cours standard', type: 'standard', ...defaultSalleFields },
  { id: 'salle-2', nom: 'Salle 102', capacite: 30, description: 'Salle de cours standard', type: 'standard', ...defaultSalleFields },
  { id: 'salle-3', nom: 'Salle 103', capacite: 25, description: 'Petite salle de cours', type: 'standard', ...defaultSalleFields },
  { id: 'salle-4', nom: 'Salle 201', capacite: 35, description: 'Grande salle de cours', type: 'standard', ...defaultSalleFields },
  { id: 'salle-5', nom: 'Salle 202', capacite: 30, description: 'Salle de cours standard', type: 'standard', ...defaultSalleFields },
  { id: 'salle-6', nom: 'Labo Physique', capacite: 24, description: 'Laboratoire de physique-chimie', type: 'laboratoire', ...defaultSalleFields },
  { id: 'salle-7', nom: 'Labo SVT', capacite: 24, description: 'Laboratoire de sciences de la vie', type: 'laboratoire', ...defaultSalleFields },
  { id: 'salle-8', nom: 'Salle Info 1', capacite: 20, description: 'Salle informatique avec 20 postes', type: 'informatique', ...defaultSalleFields },
  { id: 'salle-9', nom: 'Salle Info 2', capacite: 18, description: 'Salle informatique avec 18 postes', type: 'informatique', ...defaultSalleFields },
  { id: 'salle-10', nom: 'Gymnase', capacite: 60, description: 'Gymnase principal', type: 'sport', ...defaultSalleFields },
  { id: 'salle-11', nom: 'Salle Arts', capacite: 25, description: 'Salle d\'arts plastiques', type: 'arts', ...defaultSalleFields },
  { id: 'salle-12', nom: 'Salle Musique', capacite: 30, description: 'Salle de musique', type: 'arts', ...defaultSalleFields },
];

// ============ CLASSES ============
export const mockClasses: Classe[] = [
  { id: 'classe-1', nom: '6ème A', niveau: '6ème', annee_scolaire: '2024-2025', capacite: 30, salle: 'Salle 101', salle_type: 'fixe' },
  { id: 'classe-2', nom: '6ème B', niveau: '6ème', annee_scolaire: '2024-2025', capacite: 30, salle: 'Salle 102', salle_type: 'fixe' },
  { id: 'classe-3', nom: '6ème C', niveau: '6ème', annee_scolaire: '2024-2025', capacite: 28, salle: 'Salle 103', salle_type: 'variable' },
  { id: 'classe-4', nom: '5ème A', niveau: '5ème', annee_scolaire: '2024-2025', capacite: 30, salle: 'Salle 201', salle_type: 'fixe' },
  { id: 'classe-5', nom: '5ème B', niveau: '5ème', annee_scolaire: '2024-2025', capacite: 30, salle: 'Salle 202', salle_type: 'fixe' },
  { id: 'classe-6', nom: '4ème A', niveau: '4ème', annee_scolaire: '2024-2025', capacite: 32, salle: 'Salle 101', salle_type: 'variable' },
  { id: 'classe-7', nom: '4ème B', niveau: '4ème', annee_scolaire: '2024-2025', capacite: 32, salle: 'Salle 102', salle_type: 'variable' },
  { id: 'classe-8', nom: '3ème A', niveau: '3ème', annee_scolaire: '2024-2025', capacite: 30, salle: 'Salle 201', salle_type: 'fixe' },
  { id: 'classe-9', nom: '3ème B', niveau: '3ème', annee_scolaire: '2024-2025', capacite: 30, salle: 'Salle 202', salle_type: 'fixe' },
  { id: 'classe-10', nom: '2nde 1', niveau: '2nde', annee_scolaire: '2024-2025', capacite: 35, salle: 'Salle 201', salle_type: 'variable' },
  { id: 'classe-11', nom: '2nde 2', niveau: '2nde', annee_scolaire: '2024-2025', capacite: 35, salle: 'Salle 202', salle_type: 'variable' },
  { id: 'classe-12', nom: '1ère S', niveau: '1ère', annee_scolaire: '2024-2025', capacite: 32, salle: 'Salle 101', salle_type: 'variable' },
  { id: 'classe-13', nom: '1ère ES', niveau: '1ère', annee_scolaire: '2024-2025', capacite: 32, salle: 'Salle 102', salle_type: 'variable' },
  { id: 'classe-14', nom: 'Terminale S', niveau: 'Terminale', annee_scolaire: '2024-2025', capacite: 30, salle: 'Salle 103', salle_type: 'variable' },
  { id: 'classe-15', nom: 'Terminale ES', niveau: 'Terminale', annee_scolaire: '2024-2025', capacite: 30, salle: 'Salle 201', salle_type: 'variable' },
];

// ============ MATIERES ============
export const mockMatieres: Matiere[] = [
  { id: 'mat-1', nom: 'Mathématiques', code: 'MATH', coefficient: 4, description: 'Algèbre, géométrie, analyse', couleur: '#2563eb' },
  { id: 'mat-2', nom: 'Français', code: 'FR', coefficient: 4, description: 'Grammaire, littérature, expression écrite', couleur: '#7c3aed' },
  { id: 'mat-3', nom: 'Histoire-Géographie', code: 'HG', coefficient: 3, description: 'Histoire et géographie', couleur: '#d97706' },
  { id: 'mat-4', nom: 'Anglais', code: 'ANG', coefficient: 3, description: 'Langue vivante 1', couleur: '#dc2626' },
  { id: 'mat-5', nom: 'Espagnol', code: 'ESP', coefficient: 2, description: 'Langue vivante 2', couleur: '#db2777' },
  { id: 'mat-6', nom: 'Physique-Chimie', code: 'PC', coefficient: 3, description: 'Sciences physiques et chimiques', couleur: '#0891b2' },
  { id: 'mat-7', nom: 'SVT', code: 'SVT', coefficient: 2, description: 'Sciences de la vie et de la terre', couleur: '#16a34a' },
  { id: 'mat-8', nom: 'Technologie', code: 'TECH', coefficient: 2, description: 'Technologie et informatique', couleur: '#475569' },
  { id: 'mat-9', nom: 'EPS', code: 'EPS', coefficient: 2, description: 'Éducation physique et sportive', couleur: '#ea580c' },
  { id: 'mat-10', nom: 'Arts Plastiques', code: 'ARTS', coefficient: 1, description: 'Arts visuels et plastiques', couleur: '#a855f7' },
  { id: 'mat-11', nom: 'Musique', code: 'MUS', coefficient: 1, description: 'Éducation musicale', couleur: '#ec4899' },
  { id: 'mat-12', nom: 'Allemand', code: 'ALL', coefficient: 2, description: 'Langue vivante 2', couleur: '#f59e0b' },
  { id: 'mat-13', nom: 'Latin', code: 'LAT', coefficient: 2, description: 'Langue ancienne', couleur: '#6366f1' },
  { id: 'mat-14', nom: 'Philosophie', code: 'PHILO', coefficient: 4, description: 'Philosophie (Terminale)', couleur: '#8b5cf6' },
  { id: 'mat-15', nom: 'SES', code: 'SES', coefficient: 3, description: 'Sciences économiques et sociales', couleur: '#14b8a6' },
];

// ============ ELEVES ============
const prenomsMasculins = ['Lucas', 'Hugo', 'Louis', 'Gabriel', 'Raphaël', 'Arthur', 'Jules', 'Adam', 'Léo', 'Nathan', 'Ethan', 'Mathis', 'Paul', 'Maxime', 'Alexandre', 'Thomas', 'Antoine', 'Baptiste', 'Clément', 'Victor', 'Théo', 'Nicolas', 'Julien', 'Pierre', 'Romain', 'Quentin', 'Axel', 'Dylan', 'Enzo', 'Mathéo'];
const prenomsFeminins = ['Emma', 'Léa', 'Chloé', 'Manon', 'Camille', 'Sarah', 'Louise', 'Jade', 'Zoé', 'Lina', 'Alice', 'Julie', 'Margot', 'Clara', 'Inès', 'Anaïs', 'Léonie', 'Marie', 'Lucie', 'Charlotte', 'Eva', 'Romane', 'Pauline', 'Marine', 'Océane', 'Ambre', 'Juliette', 'Lisa', 'Laura', 'Mathilde'];
const noms = ['Martin', 'Bernard', 'Thomas', 'Petit', 'Robert', 'Richard', 'Durand', 'Dubois', 'Moreau', 'Laurent', 'Simon', 'Michel', 'Lefebvre', 'Leroy', 'Roux', 'David', 'Bertrand', 'Morel', 'Fournier', 'Girard', 'Bonnet', 'Dupont', 'Lambert', 'Fontaine', 'Rousseau', 'Vincent', 'Muller', 'Lefevre', 'Faure', 'Andre', 'Mercier', 'Blanc', 'Guerin', 'Boyer', 'Garnier', 'Chevalier', 'François', 'Legrand', 'Gauthier', 'Garcia'];

function generateEleves(): Eleve[] {
  const eleves: Eleve[] = [];
  let eleveId = 1;

  mockClasses.forEach(classe => {
    // Générer entre 20 et 28 élèves par classe
    const nbEleves = 20 + Math.floor(Math.random() * 9);
    
    for (let i = 0; i < nbEleves; i++) {
      const genre = Math.random() > 0.5 ? 'M' : 'F';
      const prenoms = genre === 'M' ? prenomsMasculins : prenomsFeminins;
      const prenom = prenoms[Math.floor(Math.random() * prenoms.length)];
      const nom = noms[Math.floor(Math.random() * noms.length)];
      
      // Générer une date de naissance cohérente avec le niveau
      let anneeNaissance: number;
      switch (classe.niveau) {
        case '6ème': anneeNaissance = 2013; break;
        case '5ème': anneeNaissance = 2012; break;
        case '4ème': anneeNaissance = 2011; break;
        case '3ème': anneeNaissance = 2010; break;
        case '2nde': anneeNaissance = 2009; break;
        case '1ère': anneeNaissance = 2008; break;
        case 'Terminale': anneeNaissance = 2007; break;
        default: anneeNaissance = 2010;
      }
      
      const mois = String(Math.floor(Math.random() * 12) + 1).padStart(2, '0');
      const jour = String(Math.floor(Math.random() * 28) + 1).padStart(2, '0');
      
      eleves.push({
        id: `eleve-${eleveId}`,
        nom,
        prenom,
        date_naissance: `${anneeNaissance}-${mois}-${jour}`,
        genre,
        classe_id: classe.id,
        email: `${prenom.toLowerCase()}.${nom.toLowerCase()}@ecole.fr`,
        telephone: `06 ${String(Math.floor(Math.random() * 100)).padStart(2, '0')} ${String(Math.floor(Math.random() * 100)).padStart(2, '0')} ${String(Math.floor(Math.random() * 100)).padStart(2, '0')} ${String(Math.floor(Math.random() * 100)).padStart(2, '0')}`,
      });
      
      eleveId++;
    }
  });

  return eleves;
}

export const mockEleves: Eleve[] = generateEleves();

// ============ NOTES ============
function generateNotes(): Note[] {
  const notes: Note[] = [];
  let noteId = 1;

  mockEleves.forEach(eleve => {
    // Pour chaque élève, générer des notes pour plusieurs matières
    const matieresAleatoires = mockMatieres
      .sort(() => Math.random() - 0.5)
      .slice(0, 6 + Math.floor(Math.random() * 4)); // 6 à 9 matières

    matieresAleatoires.forEach(matiere => {
      // Générer 2-4 notes par matière pour le trimestre 1
      const nbNotes = 2 + Math.floor(Math.random() * 3);
      
      for (let i = 0; i < nbNotes; i++) {
        // Notes entre 5 et 20 avec une distribution plus réaliste
        const baseNote = 8 + Math.random() * 10;
        const variation = (Math.random() - 0.5) * 4;
        const valeur = Math.round(Math.min(20, Math.max(0, baseNote + variation)) * 2) / 2;
        
        notes.push({
          id: `note-${noteId}`,
          eleve_id: eleve.id,
          matiere_id: matiere.id,
          valeur,
          trimestre: 1,
          date: `2024-${String(9 + Math.floor(Math.random() * 3)).padStart(2, '0')}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}`,
          commentaire: Math.random() > 0.7 ? ['Bon travail', 'Peut mieux faire', 'Excellent', 'En progrès', 'Efforts à fournir'][Math.floor(Math.random() * 5)] : undefined,
        });
        
        noteId++;
      }
    });
  });

  return notes;
}

export const mockNotes: Note[] = generateNotes();

// ============ PLANNING / CRENEAUX ============
function generateCreneaux(): Creneau[] {
  const creneaux: Creneau[] = [];
  let creneauId = 1;
  
  const jours: JourSemaine[] = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi'];
  const heuresDebut = ['08:00', '09:00', '10:00', '11:00', '14:00', '15:00', '16:00'];
  
  const enseignants: Record<string, string> = {
    'mat-1': 'M. Dupont',
    'mat-2': 'Mme Martin',
    'mat-3': 'M. Bernard',
    'mat-4': 'Mme Johnson',
    'mat-5': 'Mme Garcia',
    'mat-6': 'M. Curie',
    'mat-7': 'Mme Darwin',
    'mat-8': 'M. Turing',
    'mat-9': 'M. Coubertin',
    'mat-10': 'Mme Picasso',
    'mat-11': 'M. Mozart',
    'mat-12': 'Mme Müller',
    'mat-13': 'M. Caesar',
    'mat-14': 'M. Socrate',
    'mat-15': 'Mme Keynes',
  };

  mockClasses.forEach(classe => {
    // Pour chaque classe, générer un emploi du temps
    const matieresClasse = mockMatieres
      .sort(() => Math.random() - 0.5)
      .slice(0, 8 + Math.floor(Math.random() * 4)); // 8 à 11 matières

    const creneauxOccupes: Set<string> = new Set();

    matieresClasse.forEach(matiere => {
      // 2 à 4 créneaux par matière selon le coefficient
      const coef = matiere.coefficient ?? (matiere.coefficients?.[0]?.coefficient ?? 2);
      const nbCreneaux = Math.min(4, Math.max(1, Math.floor(coef / 1.5)));
      
      for (let i = 0; i < nbCreneaux; i++) {
        // Trouver un créneau libre
        let attempts = 0;
        let jour: JourSemaine;
        let heureDebut: string;
        let heureFin: string;
        
        do {
          jour = jours[Math.floor(Math.random() * jours.length)];
          const heureIndex = Math.floor(Math.random() * heuresDebut.length);
          heureDebut = heuresDebut[heureIndex];
          
          // Durée de 1h ou 2h
          const duree = matiere.code === 'EPS' ? 2 : (Math.random() > 0.7 ? 2 : 1);
          const heureFinNum = parseInt(heureDebut.split(':')[0]) + duree;
          heureFin = `${String(heureFinNum).padStart(2, '0')}:00`;
          
          attempts++;
        } while (creneauxOccupes.has(`${jour}-${heureDebut}`) && attempts < 20);

        if (attempts < 20) {
          creneauxOccupes.add(`${jour}-${heureDebut}`);
          
          // Déterminer la salle
          let salleNom = classe.salle;
          if (classe.salle_type === 'variable') {
            // Choisir une salle appropriée selon la matière
            if (matiere.code === 'PC' || matiere.code === 'SVT') {
              salleNom = matiere.code === 'PC' ? 'Labo Physique' : 'Labo SVT';
            } else if (matiere.code === 'TECH') {
              salleNom = 'Salle Info 1';
            } else if (matiere.code === 'EPS') {
              salleNom = 'Gymnase';
            } else if (matiere.code === 'ARTS') {
              salleNom = 'Salle Arts';
            } else if (matiere.code === 'MUS') {
              salleNom = 'Salle Musique';
            } else {
              salleNom = mockSalles.filter(s => s.type === 'standard')[Math.floor(Math.random() * 5)].nom;
            }
          }

          creneaux.push({
            id: `creneau-${creneauId}`,
            classe_id: classe.id,
            matiere_id: matiere.id,
            matiere_nom: matiere.nom,
            matiere_couleur: matiere.couleur || '#2563eb',
            jour,
            heure_debut: heureDebut,
            heure_fin: heureFin,
            salle: salleNom,
            enseignant: enseignants[matiere.id] || '',
          });
          
          creneauId++;
        }
      }
    });
  });

  return creneaux;
}

export const mockCreneaux: Creneau[] = generateCreneaux();

// ============ BULLETIN MOCK ============
export function generateMockBulletin(eleveId: string, trimestre: number) {
  const eleveNotes = mockNotes.filter(n => n.eleve_id === eleveId && n.trimestre === trimestre);
  
  const matiereMap = new Map<string, { notes: number[]; matiere: Matiere }>();
  
  eleveNotes.forEach(note => {
    const matiere = mockMatieres.find(m => m.id === note.matiere_id);
    if (matiere) {
      if (!matiereMap.has(note.matiere_id)) {
        matiereMap.set(note.matiere_id, { notes: [], matiere });
      }
      matiereMap.get(note.matiere_id)!.notes.push(note.valeur);
    }
  });

  return Array.from(matiereMap.values()).map(({ notes, matiere }) => ({
    matiere_id: matiere.id,
    matiere_nom: matiere.nom,
    code: matiere.code,
    coefficient: matiere.coefficient,
    notes,
    moyenne: Math.round((notes.reduce((a, b) => a + b, 0) / notes.length) * 10) / 10,
  }));
}

// ============ ANNÉE SCOLAIRE MOCK ============
export const mockAnnees: AnneeScolaire[] = [
  {
    id: 'annee-1',
    label: '2024-2025',
    debut: '2024-09-02',
    fin: '2025-07-05',
    statut: 'active',
    historique: [
      { action: 'creation', date: '2024-07-01T10:00:00.000Z', details: 'Année scolaire 2024-2025 créée' },
      { action: 'demarrage', date: '2024-09-02T08:00:00.000Z', details: 'Année scolaire 2024-2025 démarrée' },
    ],
  },
  {
    id: 'annee-0',
    label: '2023-2024',
    debut: '2023-09-04',
    fin: '2024-07-06',
    statut: 'terminee',
    historique: [
      { action: 'creation', date: '2023-07-01T10:00:00.000Z', details: 'Année scolaire 2023-2024 créée' },
      { action: 'demarrage', date: '2023-09-04T08:00:00.000Z', details: 'Année scolaire 2023-2024 démarrée' },
      { action: 'cloture', date: '2024-07-06T17:00:00.000Z', details: 'Année scolaire 2023-2024 terminée' },
    ],
  },
];
