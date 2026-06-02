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
  dashboard: (classesPage?: number, classesLimit?: number, anneeId?: string) =>
    get<any>(`/dashboard${qs({ classesPage, classesLimit, anneeId })}`),

  classesList: (page?: number, limit?: number, search?: string, niveau?: string, anneeId?: string) =>
    get<any>(`/classes${qs({ page, limit, search, niveau, anneeId })}`),

  classeEleves: (id: string, page?: number, limit?: number, search?: string, eleveId?: string, anneeId?: string) =>
    get<any>(`/classes/${id}/eleves${qs({ page, limit, search, eleveId, anneeId })}`),

  elevesList: (page?: number, limit?: number, search?: string, classeId?: string, eleveId?: string, anneeId?: string) =>
    get<any>(`/eleves${qs({ page, limit, search, classeId, eleveId, anneeId })}`),

  matieresList: (page?: number, limit?: number, niveau?: string, anneeId?: string) =>
    get<any>(`/matieres${qs({ page, limit, niveau: niveau || undefined, anneeId })}`),

  sallesList: (page?: number, limit?: number, type?: string, search?: string, anneeId?: string) =>
    get<any>(`/salles${qs({ page, limit, type: type || undefined, search: search || undefined, anneeId })}`),

  salleDetail: (id: string) => get<any>(`/salles/${id}`),

  planningClasses: (anneeId?: string) =>
    get<any>(`/planning/classes${qs({ anneeId })}`),
  planningClasse: (id: string) => get<any>(`/planning/classe/${id}`),

  notesFilters: (anneeId?: string) =>
    get<any>(`/notes/filters${qs({ anneeId })}`),
  notesEleves: (classeId: string, matiereId: string, trimestre: number, anneeId?: string) =>
    get<any>(`/notes/eleves${qs({ classeId, matiereId, trimestre, anneeId })}`),

  bulletin: (eleveId: string, trimestre: number, anneeId?: string) =>
    get<any>(`/bulletin/${eleveId}${qs({ trimestre, anneeId })}`),

  anneeSnapshot: (id: string) => get<any>(`/annees/${id}/snapshot`),
  eleveFiche: (id: string, anneeId?: string) =>
    get<any>(`/eleves/${id}/fiche${qs({ anneeId })}`),
  createClasseData: () => get<any>('/create-classe'),
  createEleveData: () => get<any>('/create-eleve'),

  niveaux: (anneeId?: string) =>
    get<any>(`/niveaux${qs({ anneeId })}`),
  classesParNiveau: (niveau: string, dateNaissance?: string, anneeId?: string) =>
    get<any>(`/niveaux/${encodeURIComponent(niveau)}/classes${qs({ dateNaissance, anneeId })}`),

  professeurs: (page = 1, limit = 20, search = '', anneeId?: string) =>
    get<any>(`/professeurs${qs({ page, limit, search: search || undefined, anneeId })}`),
  professeursActifs: () => get<any>('/professeurs/actifs'),
  professeur: (id: string, anneeId?: string) => get<any>(`/professeurs/${id}${qs({ anneeId })}`),

  periodes: (anneeScolaireId: string) =>
    get<any>(`/periodes${qs({ anneeScolaireId })}`),

  activePeriode: () => get<any>('/periodes/active'),

  evaluationsList: (classeId?: string, matiereId?: string, trimestre?: number, statut?: string, page = 1, anneeId?: string) =>
    get<any>(`/evaluations${qs({ classeId, matiereId, trimestre, statut, page, anneeId })}`),

  evaluationDetail: (id: string) => get<any>(`/evaluations/${id}`),

  elevesSansClasse: (page?: number, limit?: number, search?: string) =>
    get<any>(`/eleves/sans-classe${qs({ page, limit, search: search || undefined })}`),

  eleveSuggestionReinscription: (id: string) => get<any>(`/eleves/${id}/suggestion-reinscription`),

  elevesNonReinscrits: () => get<any[]>('/eleves/non-reinscrits'),
};
