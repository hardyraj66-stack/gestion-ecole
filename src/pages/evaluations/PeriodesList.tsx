import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useAnnees } from '../../contexts/AnneeContext';
import { API_BASE_URL } from '../../config/api';
import { usePeriodes } from '../../contexts/PeriodeContext';
import { useViewing } from '../../contexts/ViewingContext';
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
  const { t } = useTranslation();
  const [confirmTerminer, setConfirmTerminer] = useState(false);
  const statut = getStatut(periode);
  const sc = {
    active:          { label: t('periodes.statuts.enCours'),       variant: 'success' as const },
    future:          { label: t('periodes.statuts.aVenir'),        variant: 'warning' as const },
    terminee:        { label: t('periodes.statuts.terminee'),      variant: 'default' as const },
    'non-planifiee': { label: t('periodes.statuts.nonPlanifiee'),  variant: 'default' as const },
  }[statut];
  const tc = {
    ds:         { label: t('periodes.types.ds'),         variant: 'primary' as const, color: 'var(--primary)', bg: 'var(--primary-light)', accent: 'color-mix(in srgb, var(--primary) 40%, transparent)' },
    evaluation: { label: t('periodes.types.evaluation'), variant: 'info'    as const, color: 'var(--info)',    bg: 'var(--info-light)',    accent: 'color-mix(in srgb, var(--info) 40%, transparent)' },
  }[periode.type as 'ds' | 'evaluation'];
  const dStart = statut === 'future'  ? daysUntil(periode.date_debut) : null;
  const dEnd   = statut === 'active'  ? daysUntil(periode.date_fin)   : null;

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
      <div style={{ height: 3, background: tc.color, opacity: statut === 'terminee' ? 0.3 : 1 }} />

      <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1 }}>

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
              {t('periodes.actions.modifier')}
            </button>
          )}
        </div>

        {isEditing && editState ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.625rem' }}>
              <div>
                <label style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{t('periodes.form.debut')}</label>
                <input type="date" value={editState.date_debut} onChange={e => onEditChange('date_debut', e.target.value)} className="input" />
              </div>
              <div>
                <label style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{t('periodes.form.fin')}</label>
                <input type="date" value={editState.date_fin} onChange={e => onEditChange('date_fin', e.target.value)} className="input" />
              </div>
            </div>
            {saveError && <p style={{ fontSize: '0.75rem', color: 'var(--danger)', margin: 0, lineHeight: 1.4 }}>{saveError}</p>}
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <Button variant="primary" size="sm" onClick={onSave} loading={saving}>{t('periodes.actions.enregistrer')}</Button>
              <Button variant="secondary" size="sm" onClick={onCancel}>{t('periodes.actions.annuler')}</Button>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {periode.date_debut && periode.date_fin ? (
              <>
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
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--border)" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                  <span style={{ fontSize: '0.82rem', color: 'var(--text)', fontWeight: 500 }}>
                    {formatDate(periode.date_fin)}
                  </span>
                </div>
                {dStart !== null && dStart >= 0 && (
                  <p style={{ fontSize: '0.77rem', color: 'var(--warning)', margin: 0, fontWeight: 600 }}>
                    {dStart === 0 ? t('periodes.commenceAujourdhui') : t('periodes.commenceDans', { count: dStart })}
                  </p>
                )}
                {dEnd !== null && (
                  <p style={{ fontSize: '0.77rem', color: 'var(--success)', margin: 0, fontWeight: 600 }}>
                    {dEnd > 0 ? t('periodes.termineDans', { count: dEnd }) : t('periodes.termineAujourdhui')}
                  </p>
                )}
                {statut === 'terminee' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 6L9 17l-5-5"/>
                    </svg>
                    <p style={{ fontSize: '0.77rem', color: 'var(--success)', margin: 0, fontWeight: 600 }}>{t('periodes.periodTerminee')}</p>
                  </div>
                )}

                {(statut === 'active' || statut === 'future') && (
                  confirmTerminer ? (
                    <div style={{
                      display: 'flex', flexDirection: 'column', gap: '0.5rem',
                      background: 'var(--danger-light)', border: '1px solid color-mix(in srgb, var(--danger) 30%, transparent)',
                      borderRadius: 8, padding: '0.75rem',
                      marginTop: '0.25rem',
                    }}>
                      <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--danger)', fontWeight: 600 }}>
                        {t('periodes.confirmCloture')}
                      </p>
                      <p style={{ margin: 0, fontSize: '0.73rem', color: 'var(--danger)', lineHeight: 1.4, opacity: 0.85 }}>
                        {t('periodes.confirmClotureMsg')}
                      </p>
                      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.15rem' }}>
                        <button
                          onClick={() => { setConfirmTerminer(false); onTerminer(); }}
                          disabled={terminating}
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                            background: 'var(--danger)', border: 'none',
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
                          {t('periodes.confirmerBtn')}
                        </button>
                        <button
                          onClick={() => setConfirmTerminer(false)}
                          style={{
                            background: 'var(--card-bg)', border: '1px solid color-mix(in srgb, var(--danger) 30%, transparent)',
                            borderRadius: 6, padding: '0.3rem 0.65rem',
                            fontSize: '0.75rem', color: 'var(--danger)',
                            cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500,
                          }}
                        >
                          {t('periodes.actions.annuler')}
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
                        background: 'var(--danger-light)', border: '1px solid color-mix(in srgb, var(--danger) 30%, transparent)',
                        borderRadius: 6, padding: '0.3rem 0.7rem',
                        fontSize: '0.75rem', color: 'var(--danger)',
                        cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600,
                        transition: 'all 0.15s',
                      }}
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 6L9 17l-5-5"/>
                      </svg>
                      {t('periodes.actions.terminerPeriode')}
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
                <span style={{ fontSize: '0.82rem' }}>{t('periodes.datesNonDefinies')}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export function PeriodesList() {
  const { t } = useTranslation();
  const { active, preparation, loading: anneeLoading } = useAnnees();
  const { updatePeriode, terminerPeriode } = usePeriodes();
  const { viewing, isViewingArchive } = useViewing();
  const annee = isViewingArchive ? viewing : (active || preparation);
  const annee_scolaire = annee?.label || '';

  const { data, loading, error } = usePeriodesData(annee_scolaire);

  const initDoneRef = useRef<string>('');
  useEffect(() => {
    if (isViewingArchive) return;
    if (!anneeLoading && !loading && annee_scolaire && active && Array.isArray(data) && data.length === 0 && initDoneRef.current !== annee_scolaire) {
      initDoneRef.current = annee_scolaire;
      fetch(`${API_BASE_URL}/periodes/init`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ annee_scolaire }),
      });
    }
  }, [isViewingArchive, anneeLoading, loading, annee_scolaire, active, data]);

  const [editing, setEditing]     = useState<EditState | null>(null);
  const [saving, setSaving]       = useState(false);
  const [saveError, setSaveError] = useState('');
  const [terminating, setTerminating] = useState<string | null>(null);

  if (anneeLoading || loading) return <PageLoader />;
  if (error) return <Alert variant="error">{t('periodes.erreurChargement')}</Alert>;

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
    else setSaveError(result.message || t('periodes.erreurMaj'));
  };

  const handleTerminer = async (periode: PeriodeRow) => {
    setTerminating(periode.id);
    await terminerPeriode(periode.id);
    setTerminating(null);
  };

  return (
    <div>
      <PageHeader
        title={t('periodes.titre')}
        subtitle={annee_scolaire ? t('periodes.soustitre', { annee: annee_scolaire }) : t('periodes.aucuneAnnee')}
      />

      {!annee_scolaire && <Alert variant="warning">{t('periodes.aucuneAnnee')}</Alert>}

      {periodes.length === 0 && annee_scolaire && (
        <Alert variant="info">{t('periodes.periodesAuto')}</Alert>
      )}

      {periodes.length > 0 && (
        <>
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
            <div className="card" style={{ padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.875rem', flex: '0 0 auto' }}>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
                </svg>
              </div>
              <div>
                <div style={{ fontSize: '1.35rem', fontWeight: 700, lineHeight: 1, color: 'var(--text)' }}>
                  {planned}<span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 400 }}>/6</span>
                </div>
                <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)', marginTop: 2 }}>{t('periodes.periodesPlannifiees')}</div>
              </div>
            </div>

            {activePeriode ? (
              <div className="card" style={{ padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.875rem', flex: '0 0 auto', border: '1px solid color-mix(in srgb, var(--success) 30%, transparent)' }}>
                <div style={{ width: 38, height: 38, borderRadius: 10, background: 'var(--success-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6L9 17l-5-5"/>
                  </svg>
                </div>
                <div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#16a34a', lineHeight: 1 }}>
                    {activePeriode.type === 'ds' ? t('periodes.types.ds') : t('periodes.types.evaluation')} T{activePeriode.trimestre} {t('periodes.enCours', { t: activePeriode.trimestre })}
                  </div>
                  <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)', marginTop: 2 }}>{t('periodes.saisieActive')}</div>
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
                  <div style={{ fontSize: '0.9rem', fontWeight: 700, lineHeight: 1 }}>{t('periodes.aucunePeriode')}</div>
                  <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)', marginTop: 2 }}>{t('periodes.saisieBloquee')}</div>
                </div>
              </div>
            )}
          </div>

          {[1, 2, 3].map(tr => {
            const ds    = periodes.find(p => p.trimestre === tr && p.type === 'ds');
            const eval_ = periodes.find(p => p.trimestre === tr && p.type === 'evaluation');
            if (!ds && !eval_) return null;
            const isActiveT = [ds, eval_].some(p => p && getStatut(p) === 'active');
            const anyActive = periodes.some(p => getStatut(p) === 'active');
            const locked = tr > 1 && (() => {
              const prev = periodes.filter(p => p.trimestre === tr - 1);
              return prev.length === 0 || !prev.every(p => getStatut(p) === 'terminee');
            })();
            const isCurrentT = !anyActive && !isActiveT && (() => {
              for (let i = 1; i <= 3; i++) {
                const tds   = periodes.find(p => p.trimestre === i && p.type === 'ds');
                const teval = periodes.find(p => p.trimestre === i && p.type === 'evaluation');
                const allDone = [tds, teval].every(p => p && getStatut(p) === 'terminee');
                if (!allDone) return i === tr;
              }
              return false;
            })();

            return (
              <div key={tr} style={{ marginBottom: '1.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.875rem' }}>
                  <div style={{
                    width: 30, height: 30, borderRadius: 7, flexShrink: 0,
                    background: (isActiveT || isCurrentT) ? '#16a34a' : 'var(--text-muted)',
                    color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.78rem', fontWeight: 700,
                  }}>T{tr}</div>
                  <h3 style={{ fontWeight: 700, fontSize: '0.97rem', margin: 0, color: 'var(--text)' }}>{t('periodes.trimestre', { t: tr })}</h3>
                  {(isActiveT || isCurrentT) && (
                    <span style={{
                      fontSize: '0.7rem', fontWeight: 600, color: '#16a34a',
                      background: 'var(--success-light)', border: '1px solid color-mix(in srgb, var(--success) 30%, transparent)',
                      borderRadius: 20, padding: '0.12rem 0.55rem',
                    }}>{t('periodes.actif')}</span>
                  )}
                  <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  {[ds, eval_].map((p) => {
                    if (!p) return null;
                    return (
                      <PeriodeCard
                        key={p.id}
                        periode={p}
                        locked={isViewingArchive || locked}
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

          <div style={{
            marginTop: '0.5rem', padding: '0.75rem 1rem',
            background: 'var(--bg-subtle)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)',
          }}>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.6 }}>
              {t('periodes.regles')}
            </p>
          </div>
        </>
      )}
    </div>
  );
}
