import { useEffect, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { API_BASE_URL } from '../../config/api';
import { SalleDisponible } from '../../types';
import { SalleOccupant } from './planning.types';

interface SalleSelectProps {
  jour: string;
  heureDebut: string;
  heureFin: string;
  value: string;
  onChange: (val: string) => void;
  excludeCreneauId?: string;
  salleFixe?: string;
  disabled?: boolean;
  initialConflict?: SalleOccupant | null;
  onConflictChange?: (hasConflict: boolean) => void;
}

function OccupantMsg({ nom: salle, occupant }: { nom: string; occupant: SalleOccupant }) {
  return (
    <div className="salle-select-error">
      ⚠ <strong>{salle}</strong> est déjà utilisée par&nbsp;
      <strong>{occupant.classe_nom}</strong>
      {occupant.matiere_nom && <> — {occupant.matiere_nom}</>}
      &nbsp;({occupant.heure_debut}→{occupant.heure_fin})
    </div>
  );
}

export function SalleSelect({
  jour, heureDebut, heureFin, value, onChange,
  excludeCreneauId, salleFixe, disabled, initialConflict, onConflictChange,
}: SalleSelectProps) {
  const { t } = useTranslation();
  const [salles, setSalles] = useState<SalleDisponible[]>([]);
  const [checking, setChecking] = useState(true);
  const [open, setOpen] = useState(false);
  const [exceptionnel, setExceptionnel] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dropdownPos, setDropdownPos] = useState<{ top: number; left: number; width: number } | null>(null);

  const fetchSalles = async () => {
    if (!jour || !heureDebut || !heureFin) return;
    setChecking(true);
    try {
      const params = new URLSearchParams({ jour, heure_debut: heureDebut, heure_fin: heureFin });
      if (excludeCreneauId) params.set('excludeCreneauId', excludeCreneauId);
      const res = await fetch(`${API_BASE_URL}/salles/disponibles?${params}`);
      if (res.ok) setSalles(await res.json());
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    fetchSalles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jour, heureDebut, heureFin, excludeCreneauId]);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  const selected = salles.find(s => s.nom === value);
  const occupant: SalleOccupant | null = checking
    ? (initialConflict ?? null)
    : (selected && !selected.disponible ? (selected.occupant as SalleOccupant | null) : null);
  const isConflict = !!occupant;

  useEffect(() => {
    onConflictChange?.(isConflict);
  }, [isConflict, onConflictChange]);

  const openDropdown = () => {
    if (disabled) return;
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setDropdownPos({ top: rect.bottom, left: rect.left, width: rect.width });
    }
    fetchSalles();
    setOpen(o => !o);
  };

  const libres = salles.filter(s => s.disponible);
  const occupees = salles.filter(s => !s.disponible);

  // ── Salle fixe ──────────────────────────────────────────────────────────────
  if (salleFixe && !exceptionnel) {
    return (
      <div className="form-group">
        <label className="form-label">{t('planning.salle.titre')}</label>
        <div className={`salle-select-fixed${initialConflict ? ' conflict' : ''}`}>
          <span className="salle-select-fixed-icon">🏫</span>
          <span className="salle-select-fixed-nom">{salleFixe}</span>
          {initialConflict
            ? <span className="salle-select-fixed-badge conflict">{t('planning.salle.fixeBadge')}</span>
            : <span className="salle-select-fixed-badge">{t('planning.salle.fixe')}</span>
          }
        </div>
        {initialConflict && (
          <OccupantMsg nom={salleFixe} occupant={initialConflict} />
        )}
        <button
          type="button"
          className="salle-select-exceptionnel-btn"
          onClick={() => { setExceptionnel(true); openDropdown(); }}
        >
          {t('planning.salle.exceptionnel')}
        </button>
      </div>
    );
  }

  return (
    <div className="form-group" ref={containerRef} style={{ position: 'relative' }}>
      <label className="form-label">
        {t('planning.salle.titreObligatoire')}
        {salleFixe && exceptionnel && (
          <span className="salle-select-exceptionnel-badge">{t('planning.salle.exceptionnelBadge')}</span>
        )}
      </label>

      <button
        type="button"
        className={`salle-select-trigger${open ? ' open' : ''}${isConflict ? ' conflict' : ''}`}
        onClick={openDropdown}
        disabled={disabled}
      >
        {value ? (
          <span className="salle-select-value">
            <span className={`salle-select-dot ${isConflict ? 'red' : checking ? 'checking' : 'green'}`} />
            {value}
            {isConflict && <span className="salle-select-conflict-hint">{t('planning.salle.conflit')}</span>}
          </span>
        ) : (
          <span className="salle-select-placeholder">{t('planning.salle.choisir')}</span>
        )}
        <span className="salle-select-arrow">▾</span>
      </button>

      {isConflict && occupant && (
        <OccupantMsg nom={value} occupant={occupant} />
      )}

      {salleFixe && exceptionnel && (
        <button
          type="button"
          className="salle-select-retour-fixe-btn"
          onClick={() => { setExceptionnel(false); onChange(salleFixe); setOpen(false); }}
        >
          {t('planning.salle.retourFixe', { salle: salleFixe })}
        </button>
      )}

      {open && dropdownPos && (
        <div
          className="salle-select-dropdown"
          style={{
            position: 'fixed',
            top: dropdownPos.top + 4,
            left: dropdownPos.left,
            width: dropdownPos.width,
            zIndex: 2000,
          }}
        >
          {checking && <div className="salle-select-empty">{t('planning.salle.chargement')}</div>}

          {!checking && libres.length === 0 && occupees.length === 0 && (
            <div className="salle-select-empty">{t('planning.salle.aucune')}</div>
          )}

          {!checking && libres.length > 0 && (
            <div className="salle-select-group">
              <div className="salle-select-group-label">{t('planning.salle.disponibles')}</div>
              {libres.map(s => (
                <button
                  key={s.id}
                  type="button"
                  className={`salle-select-option available${value === s.nom ? ' selected' : ''}`}
                  onClick={() => { onChange(s.nom); setOpen(false); }}
                >
                  <span className="salle-select-dot green" />
                  <span className="salle-select-option-nom">{s.nom}</span>
                  <span className="salle-select-option-meta">{s.type} · {s.capacite} pl.</span>
                  <span className="salle-select-option-status free">{t('planning.salle.libre')}</span>
                </button>
              ))}
            </div>
          )}

          {!checking && occupees.length > 0 && (
            <div className="salle-select-group">
              <div className="salle-select-group-label">{t('planning.salle.indisponibles')}</div>
              {occupees.map(s => (
                <div key={s.id} className="salle-select-option unavailable">
                  <span className="salle-select-dot red" />
                  <div className="salle-select-option-content">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span className="salle-select-option-nom">{s.nom}</span>
                      <span className="salle-select-option-meta">{s.capacite} pl.</span>
                      <span className="salle-select-option-status busy">{t('planning.salle.occupee')}</span>
                    </div>
                    {s.occupant && (
                      <div className="salle-select-occupant">
                        <strong>{s.occupant.classe_nom}</strong>
                        {s.occupant.matiere_nom && <> — {s.occupant.matiere_nom}</>}
                        {' '}· {s.occupant.heure_debut}→{s.occupant.heure_fin}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
