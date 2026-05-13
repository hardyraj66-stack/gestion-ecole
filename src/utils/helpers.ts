import { Eleve, TypeSalle, TYPES_SALLE, BadgeVariant } from '../types';

// Initiales d'un élève
export function getInitials(eleve: Pick<Eleve, 'nom' | 'prenom'>): string {
  return (eleve.prenom[0] + eleve.nom[0]).toUpperCase();
}

// Âge en années entières
export function getAge(dateNaissance: string): number {
  const today = new Date();
  const birth = new Date(dateNaissance);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

// Format date dd/MM/yyyy
export function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('fr-FR');
}

// Couleur selon la note
export function getNoteColor(note: number): string {
  if (note >= 16) return '#16a34a';
  if (note >= 14) return '#65a30d';
  if (note >= 10) return '#d97706';
  if (note >= 8) return '#ea580c';
  return '#dc2626';
}

// Mention selon la note
export function getMention(note: number): { label: string; variant: BadgeVariant } {
  if (note >= 16) return { label: 'Très bien', variant: 'success' };
  if (note >= 14) return { label: 'Bien', variant: 'success' };
  if (note >= 12) return { label: 'Assez bien', variant: 'info' };
  if (note >= 10) return { label: 'Passable', variant: 'warning' };
  return { label: 'Insuffisant', variant: 'danger' };
}

// Label d'un type de salle
export function getTypeLabel(type: TypeSalle): string {
  return TYPES_SALLE.find(t => t.value === type)?.label ?? type;
}

// Generate school years
export function generateSchoolYears(): string[] {
  const currentYear = new Date().getFullYear();
  const years: string[] = [];
  for (let i = 0; i < 3; i++) {
    const start = currentYear + i;
    years.push(`${start}-${start + 1}`);
  }
  return years;
}

// Planning hours
export function generatePlanningHours(): string[] {
  const hours: string[] = [];
  for (let h = 7; h <= 18; h++) {
    hours.push(`${h.toString().padStart(2, '0')}:00`);
    if (h < 18) {
      hours.push(`${h.toString().padStart(2, '0')}:30`);
    }
  }
  return hours;
}

// Calculate duration in hours
export function calculateDuration(heureDebut: string, heureFin: string): number {
  const [h1, m1] = heureDebut.split(':').map(Number);
  const [h2, m2] = heureFin.split(':').map(Number);
  const minutes1 = h1 * 60 + m1;
  const minutes2 = h2 * 60 + m2;
  return (minutes2 - minutes1) / 60;
}
