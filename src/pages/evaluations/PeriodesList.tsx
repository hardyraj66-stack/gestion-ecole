import { useState, useEffect, useRef } from 'react';
import { useAnnees } from '../../contexts/AnneeContext';
import { API_BASE_URL } from '../../config/api';
import { usePeriodes } from '../../contexts/PeriodeContext';
import { usePeriodesData } from '../../hooks/usePeriodesData';
import { PageHeader } from '../../components/ui/PageHeader';
import { PageLoader } from '../../components/ui/PageLoader';
import { Alert } from '../../components/shared/Alert';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/shared/Button';

type Statut = 'active' | 'future' | 'terminee' | 'non-planifiee';

function getStatut(p: PeriodeRow): Statut {
  if (p.statut) return p.statut as Statut;
  if (p.terminee) return 'terminee';
  if (!p.date_debut || !p.date_fin) return 'non-planifiee';
  return 'non-planifiee';
}

const STATUT_CONFIG = {
  active:          { label: 'En cours',     variant: 'success' as const },
  future:          { label: 'À venir',       variant: 'warning' as const },
  terminee:        { label: 'Terminée',      variant: 'default' as const },
  'non-planifiee': { label: 'Non planifiée', variant: 'default' as const },
};

const TYPE_CONFIG = {
  ds:         { label: 'DS',         variant: 'primary' as const, color: 'var(--primary)', bg: 'var(--primary-light)', accent: 'color-mix(in srgb, var(--primary) 40%, transparent)' },
  evaluation: { label: 'Évaluation', variant: 'info'    as const, color: 'var(--info)',    bg: 'var(--info-light)',    accent: 'color-mix(in srgb, var(--info) 40%, transparent)' },
};

function formatDate(d: string | null) {
  if (!d) return null;
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

function daysUntil(d: string | null) {
  if (!d) return null;
  const [y, m, day] = d.split('-').map(Number);
  const target = new Date(y, m - 1, day).getTime();
  const today = new Date().setHours(0, 0, 0, 0);
  return Math.round((target - today) / 86400000);
}

interface PeriodeRow { id: string; trimestre: number; type: string; date_debut: string | null; date_fin: string | null; terminee?: boolean; statut?: string; }
interface EditState   { id: string; date_debut: string; date_fin: string; }

function PeriodeCard({
  periode, locked, onEdit, isEditing, editState, onEditChange, onSave, onCancel, saving, saveError, onTerminer, terminating,
}: {
  periode: PeriodeRow; locked: boolean; onEdit: () => void; isEditing: boolean;
  editState: EditState | null;
  onEditChange: (f: 'date_debut' | 'date_fin', v: string) => void;
  onSave: () => void; onCancel: () => void; saving: boolean; saveError: string;
  onTerminer: () => void; terminating: boolean;
}) {
  const [confirmTerminer, setConfirmTerminer] = useState(false);
  const statut  = getStatut(periode);
  const sc      = STATUT_CONFIG[statut];
  const tc      = TYPE_CONFIG[periode.type as 'ds' | 'evaluation'];
  const dStart  = statut === 'future'  ? daysUntil(periode.date_debut) : null;
  const dEnd    = statut === 'active'  ? daysUntil(periode.date_fin)   : null;

  return (
    <div style={{
      background: 'var(--card-bg)',
      borderRadius: 'var(--radius)',
      boxShadow: statut === 'active'
        ? `0 0 0 2px ${tc.color}, var(--card-shadow)`
        : 'var(--card-shadow)',
      display: 'flex', flexDirection: 'column',
      overflow: 'hidden',
      transition: 'box-shadow 0.2s',
    }}>
      {/* Barre colorée */}
      <div style={{ height: 3, background: tc.color, opacity: statut === 'terminee' ? 0.3 : 1 }} />

      <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1 }}>

        {/* Type + statut + bouton modifier */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
              background: tc.bg, color: tc.color, borderRadius: 6,
              padding: '0.18rem 0.55rem', fontSize: '0.78rem', fontWeight: 700,
            }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: tc.color, flexShrink: 0 }} />
              {tc.label}
            </span>
            <Badge variant={sc.variant} label={sc.label} />
          </div>
          {!isEditing && statut !== 'terminee' && !locked && (
            <button onClick={onEdit} style={{
              display: 'flex', alignItems: 'center', gap: '0.25rem',
              background: 'transparent', border: '1px solid var(--border)',
              borderRadius: 6, padding: '0.25rem 0.55rem',
              fontSize: '0.73rem', color: 'var(--text-muted)',
              cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500,
              flexShrink: 0, transition: 'all 0.15s',
            }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
              Modifier
            </button>
          )}
        </div>

        {/* Contenu */}
        {isEditing && editState ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.625rem' }}>
              <div>
                <label style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Début</label>
                <input type="date" value={editState.date_debut} onChange={e => onEditChange('date_debut', e.target.value)} className="input" />
              </div>
              <div>
                <label style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Fin</label>
                <input type="date" value={editState.date_fin} onChange={e => onEditChange('date_fin', e.target.value)} className="input" />
              </div>
            </div>
            {saveError && <p style={{ fontSize: '0.75rem', color: 'var(--danger)', margin: 0, lineHeight: 1.4 }}>{saveError}</p>}
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <Button variant="primary" size="sm" onClick={onSave} loading={saving}>Enregistrer</Button>
              <Button variant="secondary" size="sm" onClick={onCancel}>Annuler</Button>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {periode.date_debut && periode.date_fin ? (
              <>
                {/* Plage de dates */}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '0.5rem',
                  background: 'var(--bg-subtle)', borderRadius: 8, padding: '0.6rem 0.75rem',
                }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={tc.color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" />
                  </svg>
                  <span style={{ fontSize: '0.82rem', color: 'var(--text)', fontWeight: 500 }}>
                    {formatDate(periode.date_debut)}
                  </span>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                  <span style={{ fontSize: '0.82rem', color: 'var(--text)', fontWeight: 500 }}>
                    {formatDate(periode.date_fin)}
                  </span>
                </div>
                {/* Contexte temporel */}
                {dStart !== null && dStart >= 0 && (
                  <p style={{ fontSize: '0.77rem', color: '#d97706', margin: 0, fontWeight: 600 }}>
                    {dStart === 0 ? "Commence aujourd'hui" : `Commence dans ${dStart} jour${dStart > 1 ? 's' : ''}`}
                  </p>
                )}
                {dEnd !== null && (
                  <p style={{ fontSize: '0.77rem', color: '#16a34a', margin: 0, fontWeight: 600 }}>
                    {dEnd > 0 ? `Se termine dans ${dEnd} jour${dEnd > 1 ? 's' : ''}` : "Se termine aujourd'hui"}
                  </p>
                )}
                {statut === 'terminee' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 6L9 17l-5-5"/>
                    </svg>
                    <p style={{ fontSize: '0.77rem', color: '#16a34a', margin: 0, fontWeight: 600 }}>Période terminée</p>
                  </div>
                )}

                {/* Bouton Terminer — visible si active ou future planifiée */}
                {(statut === 'active' || statut === 'future') && (
                  confirmTerminer ? (
                    <div style={{
                      display: 'flex', flexDirection: 'column', gap: '0.5rem',
                      background: '#fef2f2', border: '1px solid #fecaca',
                      borderRadius: 8, padding: '0.75rem',
                      marginTop: '0.25rem',
                    }}>
                      <p style={{ margin: 0, fontSize: '0.78rem', color: '#991b1b', fontWeight: 600 }}>
                        Confirmer la clôture de cette période ?
                      </p>
                      <p style={{ margin: 0, fontSize: '0.73rem', color: '#dc2626', lineHeight: 1.4 }}>
                        La date de fin sera fixée à aujourd'hui. Cette action ne peut pas être annulée.
                      </p>
                      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.15rem' }}>
                        <button
                          onClick={() => { setConfirmTerminer(false); onTerminer(); }}
                          disabled={terminating}
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                            background: '#dc2626', border: 'none',
                            borderRadius: 6, padding: '0.3rem 0.75rem',
                            fontSize: '0.75rem', color: 'white',
                            cursor: terminating ? 'not-allowed' : 'pointer',
                            fontFamily: 'inherit', fontWeight: 600,
                          }}
                        >
                          {terminating ? (
                            <span style={{ width: 10, height: 10, border: '1.5px solid white', borderTopColor: 'transparent', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.8s linear infinite' }} />
                          ) : (
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                              <path d="M20 6L9 17l-5-5"/>
                            </svg>
                          )}
                          Confirmer
                        </button>
                        <button
                          onClick={() => setConfirmTerminer(false)}
                          style={{
                            background: 'var(--card-bg)', border: '1px solid #fecaca',
                            borderRadius: 6, padding: '0.3rem 0.65rem',
                            fontSize: '0.75rem', color: '#dc2626',
                            cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500,
                          }}
                        >
                          Annuler
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmTerminer(true)}
                      disabled={terminating}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
                        marginTop: '0.25rem', alignSelf: 'flex-start',
                        background: '#fef2f2', border: '1px solid #fecaca',
                        borderRadius: 6, padding: '0.3rem 0.7rem',
                        fontSize: '0.75rem', color: '#dc2626',
                        cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600,
                        transition: 'all 0.15s',
                      }}
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 6L9 17l-5-5"/>
                      </svg>
                      Terminer la période
                    </button>
                  )
                )}
              </>
            ) : (
              <div style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                background: 'var(--bg-subtle)', borderRadius: 8, padding: '0.6rem 0.75rem',
                color: 'var(--text-muted)',
              }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" />
                </svg>
                <span style={{ fontSize: '0.82rem' }}>Dates non définies</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export function PeriodesList() {
  const { active, preparation, loading: anneeLoading } = useAnnees();
  const { updatePeriode, terminerPeriode } = usePeriodes();
  const annee = active || preparation;
  const annee_scolaire = annee?.label || '';

  const { data, loading, error } = usePeriodesData(annee_scolaire);

  // Auto-init : si l'année est active et les périodes manquent, les créer automatiquement
  const initDoneRef = useRef<string>('');
  useEffect(() => {
    if (!anneeLoading && !loading && annee_scolaire && active && Array.isArray(data) && data.length === 0 && initDoneRef.current !== annee_scolaire) {
      initDoneRef.current = annee_scolaire;
      fetch(`${API_BASE_URL}/periodes/init`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ annee_scolaire }),
      });
    }
  }, [anneeLoading, loading, annee_scolaire, active, data]);

  const [editing, setEditing]     = useState<EditState | null>(null);
  const [saving, setSaving]       = useState(false);
  const [saveError, setSaveError] = useState('');
  const [terminating, setTerminating] = useState<string | null>(null);

  if (anneeLoading || loading) return <PageLoader />;
  if (error) return <Alert variant="error">Erreur lors du chargement des périodes.</Alert>;

  const periodes: PeriodeRow[] = (Array.isArray(data) ? data : []).sort(
    (a: PeriodeRow, b: PeriodeRow) => a.trimestre !== b.trimestre ? a.trimestre - b.trimestre : a.type === 'ds' ? -1 : 1,
  );

  const activePeriode = periodes.find(p => getStatut(p) === 'active');
  const planned = periodes.filter(p => p.date_debut && p.date_fin).length;

  const handleSave = async () => {
    if (!editing) return;
    setSaving(true); setSaveError('');
    const result = await updatePeriode(editing.id, { date_debut: editing.date_debut || null, date_fin: editing.date_fin || null });
    setSaving(false);
    if (result.ok) setEditing(null);
    else setSaveError(result.message || 'Erreur lors de la mise à jour.');
  };

  const handleTerminer = async (periode: PeriodeRow) => {
    setTerminating(periode.id);
    await terminerPeriode(periode.id);
    setTerminating(null);
  };

  return (
    <div>
      <PageHeader
        title="Périodes d'évaluation"
        subtitle={annee_scolaire ? `Année scolaire ${annee_scolaire}` : 'Aucune année active'}
      />

      {!annee_scolaire && <Alert variant="warning">Aucune année scolaire active ou en préparation.</Alert>}

      {periodes.length === 0 && annee_scolaire && (
        <Alert variant="info">Les 6 périodes seront créées automatiquement au démarrage de l'année scolaire.</Alert>
      )}

      {periodes.length > 0 && (
        <>
          {/* ── Stats ── */}
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
            <div className="card" style={{ padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.875rem', flex: '0 0 auto' }}>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
                </svg>
              </div>
              <div>
                <div style={{ fontSize: '1.35rem', fontWeight: 700, lineHeight: 1, color: 'var(--text)' }}>
                  {planned}<span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 400 }}>/6</span>
                </div>
                <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)', marginTop: 2 }}>Périodes planifiées</div>
              </div>
            </div>

            {activePeriode ? (
              <div className="card" style={{ padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.875rem', flex: '0 0 auto', border: '1px solid #bbf7d0' }}>
                <div style={{ width: 38, height: 38, borderRadius: 10, background: 'var(--success-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6L9 17l-5-5"/>
                  </svg>
                </div>
                <div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#16a34a', lineHeight: 1 }}>
                    {TYPE_CONFIG[activePeriode.type as 'ds' | 'evaluation'].label} T{activePeriode.trimestre} en cours
                  </div>
                  <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)', marginTop: 2 }}>Saisie des notes active</div>
                </div>
              </div>
            ) : (
              <div className="card" style={{ padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.875rem', flex: '0 0 auto' }}>
                <div style={{ width: 38, height: 38, borderRadius: 10, background: 'var(--warning-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>
                  </svg>
                </div>
                <div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 700, lineHeight: 1 }}>Aucune période active</div>
                  <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)', marginTop: 2 }}>Saisie des notes bloquée</div>
                </div>
              </div>
            )}
          </div>

          {/* ── Grille par trimestre — 2 colonnes DS | Évaluation ── */}
          {[1, 2, 3].map(t => {
            const ds   = periodes.find(p => p.trimestre === t && p.type === 'ds');
            const eval_ = periodes.find(p => p.trimestre === t && p.type === 'evaluation');
            if (!ds && !eval_) return null;
            const isActiveT = [ds, eval_].some(p => p && getStatut(p) === 'active');
            const anyActive = periodes.some(p => getStatut(p) === 'active');
            // Trimestre verrouillé si le trimestre précédent n'est pas entièrement terminé
            const locked = t > 1 && (() => {
              const prev = periodes.filter(p => p.trimestre === t - 1);
              return prev.length === 0 || !prev.every(p => getStatut(p) === 'terminee');
            })();
            const isCurrentT = !anyActive && !isActiveT && (() => {
              for (let i = 1; i <= 3; i++) {
                const tds   = periodes.find(p => p.trimestre === i && p.type === 'ds');
                const teval = periodes.find(p => p.trimestre === i && p.type === 'evaluation');
                const allDone = [tds, teval].every(p => p && getStatut(p) === 'terminee');
                if (!allDone) return i === t;
              }
              return false;
            })();

            return (
              <div key={t} style={{ marginBottom: '1.75rem' }}>
                {/* Header trimestre */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.875rem' }}>
                  <div style={{
                    width: 30, height: 30, borderRadius: 7, flexShrink: 0,
                    background: (isActiveT || isCurrentT) ? '#16a34a' : 'var(--text)',
                    color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.78rem', fontWeight: 700,
                  }}>T{t}</div>
                  <h3 style={{ fontWeight: 700, fontSize: '0.97rem', margin: 0, color: 'var(--text)' }}>Trimestre {t}</h3>
                  {(isActiveT || isCurrentT) && (
                    <span style={{
                      fontSize: '0.7rem', fontWeight: 600, color: '#16a34a',
                      background: 'var(--success-light)', border: '1px solid #bbf7d0',
                      borderRadius: 20, padding: '0.12rem 0.55rem',
                    }}>Actif</span>
                  )}
                  <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                </div>

                {/* 2 colonnes fixes : DS à gauche, Évaluation à droite */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  {[ds, eval_].map((p) => {
                    if (!p) return null;
                    return (
                      <PeriodeCard
                        key={p.id}
                        periode={p}
                        locked={locked}
                        onEdit={() => { setEditing({ id: p.id, date_debut: p.date_debut || '', date_fin: p.date_fin || '' }); setSaveError(''); }}
                        isEditing={editing?.id === p.id}
                        editState={editing?.id === p.id ? editing : null}
                        onEditChange={(field, val) => setEditing(prev => prev ? { ...prev, [field]: val } : null)}
                        onSave={handleSave}
                        onCancel={() => setEditing(null)}
                        saving={saving}
                        saveError={saveError}
                        onTerminer={() => handleTerminer(p)}
                        terminating={terminating === p.id}
                      />
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* Règle métier */}
          <div style={{
            marginTop: '0.5rem', padding: '0.75rem 1rem',
            background: 'var(--bg-subtle)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)',
          }}>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.6 }}>
              <strong style={{ color: 'var(--text)' }}>Règles :</strong> La période Évaluation doit commencer après la fin du DS du même trimestre.
              Le Trimestre 2 ne peut être planifié qu'après la clôture complète du Trimestre 1 (idem T3 après T2).
              La saisie des notes est automatiquement bloquée en dehors de toute période active.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
