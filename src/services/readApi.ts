import { API_BASE_URL } from '../config/api';

async function get<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/read${path}`);
    if (res.ok) return res.json();
    return null;
  } catch { return null; }
}

function qs(params: Record<string, string | number | undefined>): string {
  const parts = Object.entries(params).filter(([, v]) => v !== undefined && v !== '').map(([k, v]) => `${k}=${encodeURIComponent(v!)}`);
  return parts.length > 0 ? `?${parts.join('&')}` : '';
}

export const readApi = {
  dashboard: (classesPage?: number, classesLimit?: number, anneeLabel?: string) =>
    get<any>(`/dashboard${qs({ classesPage, classesLimit, anneeLabel })}`),

  classesList: (page?: number, limit?: number, search?: string, niveau?: string, anneeLabel?: string) =>
    get<any>(`/classes${qs({ page, limit, search, niveau, anneeLabel })}`),

  classeEleves: (id: string, page?: number, limit?: number, search?: string, eleveId?: string, anneeLabel?: string) =>
    get<any>(`/classes/${id}/eleves${qs({ page, limit, search, eleveId, anneeLabel })}`),

  elevesList: (page?: number, limit?: number, search?: string, classeId?: string, eleveId?: string, anneeLabel?: string) =>
    get<any>(`/eleves${qs({ page, limit, search, classeId, eleveId, anneeLabel })}`),

  matieresList: (page?: number, limit?: number, niveau?: string) =>
    get<any>(`/matieres${qs({ page, limit, niveau: niveau || undefined })}`),

  sallesList: (page?: number, limit?: number, type?: string, search?: string) =>
    get<any>(`/salles${qs({ page, limit, type: type || undefined, search: search || undefined })}`),

  salleDetail: (id: string) => get<any>(`/salles/${id}`),

  planningClasses: (anneeLabel?: string) =>
    get<any>(`/planning/classes${qs({ anneeLabel })}`),
  planningClasse: (id: string) => get<any>(`/planning/classe/${id}`),

  notesPage: () => get<any>('/notes'),
  notesFilters: (anneeLabel?: string) =>
    get<any>(`/notes/filters${qs({ anneeLabel })}`),
  notesEleves: (classeId: string, matiereId: string, trimestre: number, anneeLabel?: string) =>
    get<any>(`/notes/eleves${qs({ classeId, matiereId, trimestre, anneeLabel })}`),

  bulletin: (eleveId: string, trimestre: number, anneeLabel?: string) =>
    get<any>(`/bulletin/${eleveId}${qs({ trimestre, anneeLabel })}`),

  anneeSnapshot: (id: string) => get<any>(`/annees/${id}/snapshot`),
  eleveFiche: (id: string, anneeLabel?: string) =>
    get<any>(`/eleves/${id}/fiche${qs({ anneeLabel })}`),
  createClasseData: () => get<any>('/create-classe'),
  createEleveData: () => get<any>('/create-eleve'),

  niveaux: (anneeLabel?: string) =>
    get<any>(`/niveaux${qs({ anneeLabel })}`),
  classesParNiveau: (niveau: string, dateNaissance?: string, anneeLabel?: string) =>
    get<any>(`/niveaux/${encodeURIComponent(niveau)}/classes${qs({ dateNaissance, anneeLabel })}`),

  professeurs: (page = 1, limit = 20, search = '') =>
    get<any>(`/professeurs${qs({ page, limit, search: search || undefined })}`),
  professeursActifs: () => get<any>('/professeurs/actifs'),
  professeur: (id: string) => get<any>(`/professeurs/${id}`),

  periodes: (annee_scolaire: string) =>
    get<any>(`/periodes${qs({ annee_scolaire })}`),

  activePeriode: () => get<any>('/periodes/active'),

  evaluationsList: (classeId?: string, matiereId?: string, trimestre?: number, statut?: string, page = 1, anneeLabel?: string) =>
    get<any>(`/evaluations${qs({ classeId, matiereId, trimestre, statut, page, anneeLabel })}`),

  evaluationDetail: (id: string) => get<any>(`/evaluations/${id}`),
};
