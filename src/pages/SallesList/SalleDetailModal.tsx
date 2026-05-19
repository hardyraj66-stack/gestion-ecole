import { useEffect, useState } from 'react';
import { Salle, SalleStats, TypeSalle, EQUIPEMENTS_SALLE, JourSemaine } from '../../types';
import { API_BASE_URL } from '../../config/api';
import { Button } from '../../components/shared/Button';
import { Badge } from '../../components/ui/Badge';
import { getTypeLabel } from '../../utils/helpers';
import { PageLoader } from '../../components/ui/PageLoader';

const typeColors: Record<TypeSalle, string> = {
  standard: '#2563eb',
  laboratoire: '#7c3aed',
  informatique: '#0891b2',
  sport: '#16a34a',
  arts: '#db2777',
  amphi: '#d97706',
  autre: '#64748b',
};

const JOURS: JourSemaine[] = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
// Plages de 30 min — de 07h à 18h
const HEURE_DEBUT = 7;
const HEURE_FIN = 18;
const SLOTS: string[] = [];
for (let h = HEURE_DEBUT; h <= HEURE_FIN; h++) {
  SLOTS.push(`${String(h).padStart(2, '0')}:00`);
  if (h < HEURE_FIN) SLOTS.push(`${String(h).padStart(2, '0')}:30`);
}
// SLOTS = 07:00, 07:30, … 17:30, 18:00 → 23 slots
const CELL_H = 52; // px par slot (30 min)
const TOTAL_H = SLOTS.length * CELL_H;

interface SalleDetailModalProps {
  salle: Salle;
  onClose: () => void;
  onEdit?: () => void;
}

interface StatsData {
  salle: Salle;
  stats: SalleStats;
  creneaux: any[];
}

function toMinutes(t: string) {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + (m || 0);
}

function creneauPx(hd: string, hf: string) {
  const originMin = HEURE_DEBUT * 60;
  const endMin = HEURE_FIN * 60;
  const startMin = Math.max(toMinutes(hd), originMin);
  const finMin = Math.min(toMinutes(hf), endMin);
  // CELL_H px = 30 min
  const top = ((startMin - originMin) / 30) * CELL_H;
  const height = Math.max(((finMin - startMin) / 30) * CELL_H, 20);
  return { top, height };
}

// Calcule les colonnes pour éviter le chevauchement visuel
// Renvoie pour chaque créneau : { col, totalCols }
function layoutCreneaux(creneaux: any[]): Map<string, { col: number; totalCols: number }> {
  // Trier par heure de début
  const sorted = [...creneaux].sort((a, b) => toMinutes(a.heure_debut) - toMinutes(b.heure_debut));

  // Groupes de créneaux qui se chevauchent
  const result = new Map<string, { col: number; totalCols: number }>();
  const cols: number[] = []; // fin (en minutes) de chaque colonne occupée

  // Première passe : assigner une colonne à chaque créneau
  const assigned = sorted.map(c => {
    const start = toMinutes(c.heure_debut);
    const end = toMinutes(c.heure_fin);
    // Trouver la première colonne libre
    let col = cols.findIndex(fin => fin <= start);
    if (col === -1) { col = cols.length; }
    cols[col] = end;
    return { id: c.id, col, start, end };
  });

  // Deuxième passe : pour chaque créneau, calculer combien de colonnes se chevauchent avec lui
  assigned.forEach(a => {
    const overlapping = assigned.filter(b =>
      b.start < a.end && b.end > a.start
    );
    const totalCols = Math.max(...overlapping.map(o => o.col)) + 1;
    result.set(a.id, { col: a.col, totalCols });
  });

  return result;
}

export function SalleDetailModal({ salle, onClose, onEdit }: SalleDetailModalProps) {
  const [statsData, setStatsData] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const color = typeColors[salle.type] || '#64748b';

  useEffect(() => {
    fetch(`${API_BASE_URL}/salles/${salle.id}/stats`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { setStatsData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [salle.id]);

  const creneauxParJour: Record<string, any[]> = {};
  if (statsData?.creneaux) {
    for (const c of statsData.creneaux) {
      if (!creneauxParJour[c.jour]) creneauxParJour[c.jour] = [];
      creneauxParJour[c.jour].push(c);
    }
  }

  // Filtre les jours qui ont au moins un créneau (+ toujours afficher Lundi–Vendredi)
  const joursActifs = JOURS.filter(j => j !== 'Samedi' || (creneauxParJour['Samedi']?.length ?? 0) > 0);

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-panel modal-xl">
        <div className="modal-header" style={{ borderTop: `4px solid ${color}` }}>
          <div>
            <h2 className="modal-title">{salle.nom}</h2>
            <div className="modal-subtitle">
              <span className="salle-type-badge" style={{ backgroundColor: `${color}18`, color }}>
                {getTypeLabel(salle.type)}
              </span>
              <span className="salle-capacite">{salle.capacite} places</span>
              {salle.accessible_pmr && <Badge label="PMR" variant="success" />}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
            {onEdit && <Button variant="outline" size="sm" onClick={onEdit}>Modifier</Button>}
            <button className="modal-close" onClick={onClose}>✕</button>
          </div>
        </div>

        <div className="modal-body salle-detail-body">
          {/* Colonne gauche — infos + stats */}
          <div className="salle-detail-left">
            {(salle.batiment || salle.etage) && (
              <div className="salle-info-block">
                <h4 className="section-label">Localisation</h4>
                <div className="salle-info-row">
                  {salle.batiment && <span>Bâtiment : <strong>{salle.batiment}</strong></span>}
                  {salle.etage && <span>Étage : <strong>{salle.etage}</strong></span>}
                </div>
              </div>
            )}

            {salle.description && (
              <div className="salle-info-block">
                <h4 className="section-label">Description</h4>
                <p className="salle-desc-text">{salle.description}</p>
              </div>
            )}

            <div className="salle-info-block">
              <h4 className="section-label">Équipements</h4>
              {salle.equipements && salle.equipements.length > 0 ? (
                <div className="equipements-list">
                  {salle.equipements.map(eq => {
                    const label = EQUIPEMENTS_SALLE.find(e => e.value === eq)?.label || eq;
                    return <Badge key={eq} label={label} variant="info" />;
                  })}
                </div>
              ) : (
                <p className="text-muted">Aucun équipement renseigné</p>
              )}
            </div>

            {loading && <PageLoader />}
            {!loading && statsData && (
              <div className="salle-info-block">
                <h4 className="section-label">Statistiques hebdomadaires</h4>
                <div className="salle-stats-grid">
                  <div className="salle-stat-item">
                    <div className="salle-stat-value">{statsData.stats.creneaux_par_semaine}</div>
                    <div className="salle-stat-label">cours / semaine</div>
                  </div>
                  <div className="salle-stat-item">
                    <div className="salle-stat-value">{statsData.stats.heures_par_semaine}h</div>
                    <div className="salle-stat-label">d'utilisation</div>
                  </div>
                  <div className="salle-stat-item">
                    <div className="salle-stat-value">{statsData.stats.jours_utilises}</div>
                    <div className="salle-stat-label">jours utilisés</div>
                  </div>
                  <div className="salle-stat-item">
                    <div className="salle-stat-value" style={{
                      color: statsData.stats.taux_occupation > 70 ? '#dc2626'
                        : statsData.stats.taux_occupation > 40 ? '#d97706' : '#16a34a',
                    }}>
                      {statsData.stats.taux_occupation}%
                    </div>
                    <div className="salle-stat-label">taux d'occupation</div>
                  </div>
                </div>
                <div className="occupation-bar-wrapper">
                  <div className="occupation-bar">
                    <div className="occupation-bar-fill" style={{
                      width: `${statsData.stats.taux_occupation}%`,
                      background: statsData.stats.taux_occupation > 70 ? '#dc2626'
                        : statsData.stats.taux_occupation > 40 ? '#d97706' : '#16a34a',
                    }} />
                  </div>
                  <span className="occupation-bar-label">{statsData.stats.taux_occupation}%</span>
                </div>
              </div>
            )}
          </div>

          {/* Colonne droite — calendrier */}
          <div className="salle-detail-right">
            <h4 className="section-label" style={{ marginTop: 0 }}>Planning hebdomadaire</h4>

            {loading ? (
              <PageLoader />
            ) : !statsData || statsData.creneaux.length === 0 ? (
              <div className="salle-planning-empty">
                <p className="text-muted">Aucun cours planifié dans cette salle</p>
              </div>
            ) : (
              <div className="salle-calendrier">
                {/* En-tête jours */}
                <div className="salle-cal-header">
                  <div className="salle-cal-time-col" />
                  {joursActifs.map(j => (
                    <div key={j} className={`salle-cal-jour${creneauxParJour[j]?.length ? ' has-cours' : ''}`}>
                      {j}
                      {creneauxParJour[j]?.length ? (
                        <span className="salle-cal-count">{creneauxParJour[j].length}</span>
                      ) : null}
                    </div>
                  ))}
                </div>

                {/* Corps — grille horaire */}
                <div className="salle-cal-body">
                  {/* Colonne heures */}
                  <div className="salle-cal-time-col">
                    {SLOTS.map(s => (
                      <div key={s} className={`salle-cal-hour${s.endsWith(':30') ? ' salle-cal-hour-half' : ''}`} style={{ height: CELL_H }}>
                        {s}
                      </div>
                    ))}
                  </div>

                  {/* Colonnes jours */}
                  {joursActifs.map(jour => {
                    const crs = creneauxParJour[jour] || [];
                    const layout = layoutCreneaux(crs);
                    return (
                      <div key={jour} className="salle-cal-col" style={{ height: TOTAL_H }}>
                        {/* Lignes de fond */}
                        {SLOTS.map((s, i) => (
                          <div key={s} className={`salle-cal-cell${s.endsWith(':00') ? ' salle-cal-cell-hour' : ' salle-cal-cell-half'}`} style={{ height: CELL_H, top: i * CELL_H }} />
                        ))}

                        {/* Créneaux — décalés si chevauchement */}
                        {crs.map((c: any) => {
                          const { top, height } = creneauPx(c.heure_debut, c.heure_fin);
                          const { col, totalCols } = layout.get(c.id) ?? { col: 0, totalCols: 1 };
                          const GAP = 3;
                          const colW = `calc(${100 / totalCols}% - ${GAP}px)`;
                          const colL = `calc(${(col * 100) / totalCols}% + ${GAP / 2}px)`;
                          const bg = c.matiere_couleur || '#2563eb';
                          return (
                            <div
                              key={c.id}
                              className="salle-cal-creneau"
                              style={{ top, height, background: bg, left: colL, width: colW, right: 'unset' }}
                              title={`${c.classe_nom || ''} · ${c.matiere_nom} — ${c.heure_debut}→${c.heure_fin}`}
                            >
                              <div className="salle-cal-creneau-inner">
                                {c.classe_nom && (
                                  <div className="salle-cal-classe">{c.classe_nom}</div>
                                )}
                                <div className="salle-cal-mat">{c.matiere_nom}</div>
                                <div className="salle-cal-time">{c.heure_debut}–{c.heure_fin}</div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
