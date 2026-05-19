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

export interface ParentInfo {
  nom: string;
  prenom: string;
  telephone?: string;
  email?: string;
  statut: 'vivant' | 'decede';
}

export interface TuteurInfo {
  nom: string;
  prenom: string;
  telephone?: string;
  email?: string;
  lien?: string;
}

export type EleveStatut = 'actif' | 'exclu' | 'parti';

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
  pere?: ParentInfo | null;
  mere?: ParentInfo | null;
  tuteur?: TuteurInfo | null;
  statut?: EleveStatut;
}

export interface Avertissement {
  id: string;
  eleve_id: string;
  motif: string;
  annee_scolaire: string;
  date: string;
  commentaire?: string;
  type: 'comportement' | 'degats' | 'absence' | 'autre';
}

export interface Convocation {
  id: string;
  eleve_id: string;
  date: string;
  raison: string;
  commentaire?: string;
  effectuee: boolean;
  nb_avertissements: number;
}

export interface EleveExclu {
  id: string;
  eleve_id: string;
  nom: string;
  prenom: string;
  classe_id: string;
  classe_nom: string;
  date_exclusion: string;
  raison: string;
  commentaire?: string;
  nb_avertissements_au_moment: number;
  annee_scolaire: string;
}

export interface EleveQuitte {
  id: string;
  eleve_id: string;
  nom: string;
  prenom: string;
  classe_id: string;
  classe_nom: string;
  date_depart: string;
  raison: string;
  commentaire?: string;
  motif: 'changement_ecole' | 'demenagement' | 'raison_familiale' | 'autre';
  annee_scolaire: string;
}

export interface Absence {
  id: string;
  eleve_id: string;
  date: string;
  motif?: string;
  type: 'absence' | 'retard';
  duree?: string;
  justifiee?: boolean;
}

export interface CoefficientNiveau {
  niveau: string;
  coefficient: number;
}

export interface Matiere {
  id: string;
  nom: string;
  code: string;
  /** Legacy global coefficient — use coefficients[] when available */
  coefficient?: number;
  coefficients?: CoefficientNiveau[];
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

export type TypeSalle = 'standard' | 'laboratoire' | 'informatique' | 'sport' | 'arts' | 'amphi' | 'autre';
export type Equipement = 'projecteur' | 'ordinateurs' | 'tableau_interactif' | 'labo_scientifique' | 'sono' | 'climatisation';

export const TYPES_SALLE: { value: TypeSalle; label: string }[] = [
  { value: 'standard', label: 'Salle de classe' },
  { value: 'laboratoire', label: 'Laboratoire' },
  { value: 'informatique', label: 'Salle informatique' },
  { value: 'sport', label: 'Salle de sport' },
  { value: 'arts', label: 'Salle arts' },
  { value: 'amphi', label: 'Amphi' },
  { value: 'autre', label: 'Autre' },
];

export const EQUIPEMENTS_SALLE: { value: Equipement; label: string }[] = [
  { value: 'projecteur', label: 'Projecteur' },
  { value: 'ordinateurs', label: 'Ordinateurs' },
  { value: 'tableau_interactif', label: 'Tableau interactif' },
  { value: 'labo_scientifique', label: 'Labo scientifique' },
  { value: 'sono', label: 'Sono / Ampli' },
  { value: 'climatisation', label: 'Climatisation' },
];

export interface Salle {
  id: string;
  nom: string;
  capacite: number;
  description: string;
  type: TypeSalle;
  equipements: Equipement[];
  accessible_pmr: boolean;
  batiment: string;
  etage: string;
}

export interface SalleDisponible extends Salle {
  disponible: boolean;
  occupant: {
    classe_id: string;
    classe_nom: string;
    matiere_nom: string;
    heure_debut: string;
    heure_fin: string;
  } | null;
}

export interface SalleStats {
  creneaux_par_semaine: number;
  jours_utilises: number;
  heures_par_semaine: number;
  taux_occupation: number;
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
