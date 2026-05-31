export type SalleType = 'fixe' | 'variable';

export interface Classe {
  id: string;
  nom: string;
  niveau: string;
  annee_scolaire: string;
  anneeScolaireId?: string;
  capacite: number;
  salle: string;
  salle_type: SalleType;
  actif?: boolean;
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
  statut: EleveStatut;
  inscrit_annee_id?: string | null;
  statut_inscription?: 'inscrit' | 'non_inscrit' | 'en_attente' | null;
}

export interface Avertissement {
  id: string;
  eleve_id: string;
  motif: string;
  annee_scolaire: string;
  anneeScolaireId?: string;
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
  anneeScolaireId?: string;
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
  anneeScolaireId?: string;
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
  ds: number | null;
  evaluation: number | null;
  moyenne: number;
}

export type PeriodeType = 'ds' | 'evaluation';

export interface PeriodeEvaluation {
  id: string;
  trimestre: Trimestre;
  type: PeriodeType;
  annee_scolaire: string;
  anneeScolaireId?: string;
  date_debut: string | null;
  date_fin: string | null;
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
  professeur_id: string;
  professeur_nom: string;
}

export interface Professeur {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  genre: 'M' | 'F';
  statut: 'actif' | 'inactif';
}

export interface TeacherAssignment {
  id: string;
  professeur_id: string;
  classe_id: string;
  matiere_id: string;
  professeur_nom?: string;
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
  // Rétrocompatibilité (virtuels Mongoose = planifié)
  debut: string | null;
  fin: string | null;
  // Nouveaux champs
  debut_planifie: string | null;
  fin_planifie:   string | null;
  debut_reel:     string | null;
  fin_reel:       string | null;
  migration_effectuee: boolean;
  statut: AnneeStatut;
  historique: AnneeHistorique[];
}

export interface NoteEvaluation {
  eleve_id: string;
  valeur: number | null;
  absent: boolean;
}
