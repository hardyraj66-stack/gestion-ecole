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
  dashboard: (classesPage?: number, classesLimit?: number) =>
    get<any>(`/dashboard${qs({ classesPage, classesLimit })}`),

  classesList: (page?: number, limit?: number, search?: string, niveau?: string) =>
    get<any>(`/classes${qs({ page, limit, search, niveau })}`),

  classeEleves: (id: string, page?: number, limit?: number, search?: string, eleveId?: string) =>
    get<any>(`/classes/${id}/eleves${qs({ page, limit, search, eleveId })}`),

  elevesList: (page?: number, limit?: number, search?: string, classeId?: string, eleveId?: string) =>
    get<any>(`/eleves${qs({ page, limit, search, classeId, eleveId })}`),

  matieresList: (page?: number, limit?: number) =>
    get<any>(`/matieres${qs({ page, limit })}`),

  sallesList: (page?: number, limit?: number) =>
    get<any>(`/salles${qs({ page, limit })}`),

  planningClasses: () => get<any>('/planning/classes'),
  planningClasse: (id: string) => get<any>(`/planning/classe/${id}`),
  notesPage: () => get<any>('/notes'),

  bulletin: (eleveId: string, trimestre: number) =>
    get<any>(`/bulletin/${eleveId}?trimestre=${trimestre}`),

  anneeSnapshot: (id: string) => get<any>(`/annees/${id}/snapshot`),
  eleveFiche: (id: string) => get<any>(`/eleves/${id}/fiche`),
  createClasseData: () => get<any>('/create-classe'),
  createEleveData: () => get<any>('/create-eleve'),
  niveaux: () => get<any>('/niveaux'),
  classesParNiveau: (niveau: string, dateNaissance?: string) =>
    get<any>(`/niveaux/${encodeURIComponent(niveau)}/classes${dateNaissance ? `?dateNaissance=${dateNaissance}` : ''}`),
};
