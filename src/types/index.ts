export type SalleType = 'fixe' | 'variable';

export interface Classe {
  id: string;
  nom: string;
  niveau: string;
  annee_scolaire: string;
  capacite: number;
  salle: string;
  salle_type: SalleType;
}

export interface Eleve {
  id: string;
  nom: string;
  prenom: string;
  date_naissance: string;
  genre: 'M' | 'F';
  classe_id: string;
  email?: string;
  telephone?: string;
  adresse?: string;
}

export interface Matiere {
  id: string;
  nom: string;
  code: string;
  coefficient: number;
  description?: string;
  couleur?: string;
}

export type Trimestre = 1 | 2 | 3;

export interface Note {
  id: string;
  eleve_id: string;
  matiere_id: string;
  valeur: number;
  trimestre: Trimestre;
  date: string;
  commentaire?: string;
}

export interface BulletinMatiere {
  matiere_id: string;
  matiere_nom: string;
  code: string;
  coefficient: number;
  notes: number[];
  moyenne: number;
}

export type JourSemaine = 'Lundi' | 'Mardi' | 'Mercredi' | 'Jeudi' | 'Vendredi' | 'Samedi';

export interface Creneau {
  id: string;
  classe_id: string;
  matiere_id: string;
  matiere_nom: string;
  matiere_couleur: string;
  jour: JourSemaine;
  heure_debut: string;
  heure_fin: string;
  salle: string;
  enseignant: string;
}

export type TypeSalle = 'standard' | 'laboratoire' | 'informatique' | 'sport' | 'arts';

export const TYPES_SALLE: { value: TypeSalle; label: string }[] = [
  { value: 'standard', label: 'Salle standard' },
  { value: 'laboratoire', label: 'Laboratoire' },
  { value: 'informatique', label: 'Salle informatique' },
  { value: 'sport', label: 'Salle de sport' },
  { value: 'arts', label: 'Salle arts' },
];

export interface Salle {
  id: string;
  nom: string;
  capacite: number;
  description: string;
  type: TypeSalle;
}

export interface SalleDisponible extends Salle {
  disponible: boolean;
  occupant: {
    classe_id: string;
    matiere_nom: string;
    heure_debut: string;
    heure_fin: string;
  } | null;
}

export type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'default' | 'primary';

// ============ ANNÉE SCOLAIRE ============
export type AnneeStatut = 'active' | 'terminee' | 'preparation';

export interface AnneeHistorique {
  action: string;
  date: string;
  details: string;
}

export interface AnneeScolaire {
  id: string;
  label: string;
  debut: string;
  fin: string;
  statut: AnneeStatut;
  historique: AnneeHistorique[];
}
