import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Salle, SalleStats, TypeSalle, EQUIPEMENTS_SALLE, JourSemaine } from '../../types';
import { JOURS } from '../Planning/planning.helpers';
import { API_BASE_URL } from '../../config/api';
import { Button } from '../../components/shared/Button';
import { Badge } from '../../components/ui/Badge';
import { getTypeLabel } from '../../utils/helpers';
import { PageLoader } from '../../components/ui/PageLoader';

const typeColors: Record<TypeSalle, string> = {
  standard:    'var(--primary)',
  laboratoire: 'var(--secondary)',
  informatique:'var(--info)',
  sport:       'var(--success)',
  arts:        'var(--secondary)',
  amphi:       'var(--warning)',
  autre:       'var(--text-muted)',
};

const HEURE_DEBUT = 7;
const HEURE_FIN = 18;
const SLOTS: string[] = [];
for (let h = HEURE_DEBUT; h <= HEURE_FIN; h++) {
  SLOTS.push(`${String(h).padStart(2, '0')}:00`);
  if (h < HEURE_FIN) SLOTS.push(`${String(h).padStart(2, '0')}:30`);
}
const CELL_H = 52;
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
  const top = ((startMin - originMin) / 30) * CELL_H;
  const height = Math.max(((finMin - startMin) / 30) * CELL_H, 20);
  return { top, height };
}

function layoutCreneaux(creneaux: any[]): Map<string, { col: number; totalCols: number }> {
  const sorted = [...creneaux].sort((a, b) => toMinutes(a.heure_debut) - toMinutes(b.heure_debut));
  const result = new Map<string, { col: number; totalCols: number }>();
  const cols: number[] = [];
  const assigned = sorted.map(c => {
    const start = toMinutes(c.heure_debut);
    const end = toMinutes(c.heure_fin);
    let col = cols.findIndex(fin => fin <= start);
    if (col === -1) { col = cols.length; }
    cols[col] = end;
    return { id: c.id, col, start, end };
  });
  assigned.forEach(a => {
    const overlapping = assigned.filter(b => b.start < a.end && b.end > a.start);
    const totalCols = Math.max(...overlapping.map(o => o.col)) + 1;
    result.set(a.id, { col: a.col, totalCols });
  });
  return result;
}

export function SalleDetailModal({ salle, onClose, onEdit }: SalleDetailModalProps) {
  const { t } = useTranslation();
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
              <span className="salle-capacite">{t('salles.card.places', { count: salle.capacite })}</span>
              {salle.accessible_pmr && <Badge label="PMR" variant="success" />}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
            {onEdit && <Button variant="outline" size="sm" onClick={onEdit}>{t('salles.detail.modifier')}</Button>}
            <button className="modal-close" onClick={onClose}>✕</button>
          </div>
        </div>

        <div className="modal-body salle-detail-body">
          <div className="salle-detail-left">
            {(salle.batiment || salle.etage) && (
              <div className="salle-info-block">
                <h4 className="section-label">{t('salles.detail.localisation')}</h4>
                <div className="salle-info-row">
                  {salle.batiment && <span>{t('salles.detail.batiment')} <strong>{salle.batiment}</strong></span>}
                  {salle.etage && <span>{t('salles.detail.etage')} <strong>{salle.etage}</strong></span>}
                </div>
              </div>
            )}

            {salle.description && (
              <div className="salle-info-block">
                <h4 className="section-label">{t('salles.detail.description')}</h4>
                <p className="salle-desc-text">{salle.description}</p>
              </div>
            )}

            <div className="salle-info-block">
              <h4 className="section-label">{t('salles.detail.equipements')}</h4>
              {salle.equipements && salle.equipements.length > 0 ? (
                <div className="equipements-list">
                  {salle.equipements.map(eq => {
                    const label = EQUIPEMENTS_SALLE.find(e => e.value === eq)?.label || eq;
                    return <Badge key={eq} label={label} variant="info" />;
                  })}
                </div>
              ) : (
                <p className="text-muted">{t('salles.detail.aucunEquip')}</p>
              )}
            </div>

            {loading && <PageLoader />}
            {!loading && statsData && (
              <div className="salle-info-block">
                <h4 className="section-label">{t('salles.detail.statsHebdo')}</h4>
                <div className="salle-stats-grid">
                  <div className="salle-stat-item">
                    <div className="salle-stat-value">{statsData.stats.creneaux_par_semaine}</div>
                    <div className="salle-stat-label">{t('salles.detail.cours')}</div>
                  </div>
                  <div className="salle-stat-item">
                    <div className="salle-stat-value">{statsData.stats.heures_par_semaine}h</div>
                    <div className="salle-stat-label">{t('salles.detail.utilisation')}</div>
                  </div>
                  <div className="salle-stat-item">
                    <div className="salle-stat-value">{statsData.stats.jours_utilises}</div>
                    <div className="salle-stat-label">{t('salles.detail.jours')}</div>
                  </div>
                  <div className="salle-stat-item">
                    <div className="salle-stat-value" style={{
                      color: statsData.stats.taux_occupation > 70 ? 'var(--danger)'
                        : statsData.stats.taux_occupation > 40 ? 'var(--warning)' : 'var(--success)',
                    }}>
                      {statsData.stats.taux_occupation}%
                    </div>
                    <div className="salle-stat-label">{t('salles.detail.taux')}</div>
                  </div>
                </div>
                <div className="occupation-bar-wrapper">
                  <div className="occupation-bar">
                    <div className="occupation-bar-fill" style={{
                      width: `${statsData.stats.taux_occupation}%`,
                      background: statsData.stats.taux_occupation > 70 ? 'var(--danger)'
                        : statsData.stats.taux_occupation > 40 ? 'var(--warning)' : 'var(--success)',
                    }} />
                  </div>
                  <span className="occupation-bar-label">{statsData.stats.taux_occupation}%</span>
                </div>
              </div>
            )}
          </div>

          <div className="salle-detail-right">
            <h4 className="section-label" style={{ marginTop: 0 }}>{t('salles.detail.planning')}</h4>

            {loading ? (
              <PageLoader />
            ) : !statsData || statsData.creneaux.length === 0 ? (
              <div className="salle-planning-empty">
                <p className="text-muted">{t('salles.detail.aucunCours')}</p>
              </div>
            ) : (
              <div className="salle-calendrier">
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

                <div className="salle-cal-body">
                  <div className="salle-cal-time-col">
                    {SLOTS.map(s => (
                      <div key={s} className={`salle-cal-hour${s.endsWith(':30') ? ' salle-cal-hour-half' : ''}`} style={{ height: CELL_H }}>
                        {s}
                      </div>
                    ))}
                  </div>

                  {joursActifs.map(jour => {
                    const crs = creneauxParJour[jour] || [];
                    const layout = layoutCreneaux(crs);
                    return (
                      <div key={jour} className="salle-cal-col" style={{ height: TOTAL_H }}>
                        {SLOTS.map((s, i) => (
                          <div key={s} className={`salle-cal-cell${s.endsWith(':00') ? ' salle-cal-cell-hour' : ' salle-cal-cell-half'}`} style={{ height: CELL_H, top: i * CELL_H }} />
                        ))}

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
