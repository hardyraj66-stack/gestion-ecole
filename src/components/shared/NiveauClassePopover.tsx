import { useState, useRef } from 'react';
import { readApi } from '../../services/readApi';
import { Popover } from './Popover';
import { Badge } from '../ui/Badge';
import { Icon } from './Icon';

interface NiveauItem { niveau: string; count: number; }
interface ClasseItem { id: string; nom: string; nb_eleves: number; capacite: number; places_restantes: number; taux: number; pleine: boolean; }

interface NiveauClassePopoverProps {
  selectedNiveau: string;
  selectedClasseId: string;
  selectedClasseNom: string;
  onChange: (niveau: string, classeId: string, classeNom: string) => void;
  showCapacite?: boolean;
}

export function NiveauClassePopover({
  selectedNiveau,
  selectedClasseId,
  selectedClasseNom,
  onChange,
  showCapacite = true,
}: NiveauClassePopoverProps) {
  const [niveaux, setNiveaux] = useState<NiveauItem[]>([]);
  const [classes, setClasses] = useState<ClasseItem[]>([]);
  const [loadingNiveaux, setLoadingNiveaux] = useState(false);
  const [loadingClasses, setLoadingClasses] = useState(false);
  const [popoverNiveau, setPopoverNiveau] = useState(false);
  const [popoverClasses, setPopoverClasses] = useState(false);
  const fetchedNiveaux = useRef(false);
  const internalNiveau = useRef(selectedNiveau);

  const openNiveauPopover = async () => {
    setPopoverNiveau(true);
    if (fetchedNiveaux.current) return;
    fetchedNiveaux.current = true;
    setLoadingNiveaux(true);
    const data = await readApi.niveaux();
    if (Array.isArray(data)) setNiveaux(data);
    setLoadingNiveaux(false);
  };

  const handleSelectNiveau = async (niveau: string) => {
    internalNiveau.current = niveau;
    setPopoverNiveau(false);
    setLoadingClasses(true);
    setPopoverClasses(true);
    const data = await readApi.classesParNiveau(niveau);
    if (data?.classes) setClasses(data.classes);
    setLoadingClasses(false);
  };

  const handleSelectClasse = (classe: ClasseItem) => {
    onChange(internalNiveau.current, classe.id, classe.nom);
    setPopoverClasses(false);
  };

  const niveauLabel = selectedNiveau
    ? `${selectedNiveau}${selectedClasseNom ? ` · ${selectedClasseNom}` : ''}`
    : 'Niveau / Classe';

  return (
    <>
      <Popover
        align="left"
        open={popoverNiveau}
        onClose={() => setPopoverNiveau(false)}
        trigger={
          <button
            type="button"
            className={`niveau-filter-btn${selectedClasseId ? ' niveau-filter-btn-active' : ''}`}
            onClick={openNiveauPopover}
          >
            <Icon path="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-2 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" size={14} />
            <span>{niveauLabel}</span>
            <Icon path="M19 9l-7 7-7-7" size={12} />
          </button>
        }
      >
        <div className="niveau-popover-header">Choisir un niveau</div>
        {loadingNiveaux ? (
          <div className="niveau-popover-loading">Chargement…</div>
        ) : niveaux.length === 0 ? (
          <div className="niveau-popover-loading">Aucun niveau disponible</div>
        ) : (
          <ul className="niveau-popover-list">
            {niveaux.map(n => (
              <li key={n.niveau}>
                <button
                  type="button"
                  className={`niveau-popover-item${selectedNiveau === n.niveau ? ' niveau-popover-item-active' : ''}`}
                  onClick={() => handleSelectNiveau(n.niveau)}
                >
                  <span className="niveau-popover-label">{n.niveau}</span>
                  <Badge label={`${n.count} classe${n.count > 1 ? 's' : ''}`} variant="default" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </Popover>

      {popoverClasses && (
        <div className="classes-popover-overlay" onClick={() => setPopoverClasses(false)}>
          <div className="classes-popover" onClick={e => e.stopPropagation()}>
            <div className="classes-popover-header">
              <button type="button" className="classes-popover-back" onClick={() => { setPopoverClasses(false); setPopoverNiveau(true); }}>
                <Icon path="M15 19l-7-7 7-7" size={16} /> Niveaux
              </button>
              <span className="classes-popover-title">{internalNiveau.current}</span>
              <button type="button" className="classe-popup-close" onClick={() => setPopoverClasses(false)}>✕</button>
            </div>

            {loadingClasses ? (
              <div className="niveau-popover-loading">Chargement des classes…</div>
            ) : classes.length === 0 ? (
              <div className="niveau-popover-loading">Aucune classe dans ce niveau</div>
            ) : (
              <ul className="classes-popover-list">
                {classes.map(c => (
                  <li key={c.id}>
                    <button
                      type="button"
                      className={`classes-popover-item${c.id === selectedClasseId ? ' classes-popover-item-active' : ''}`}
                      onClick={() => handleSelectClasse(c)}
                    >
                      <div className="classes-popover-item-left">
                        <span className="classes-popover-item-nom">{c.nom}</span>
                        {c.pleine && <Badge label="Complète" variant="danger" />}
                      </div>
                      {showCapacite && (
                        <div className="classes-popover-item-right">
                          <span className="classes-popover-item-count">{c.nb_eleves}/{c.capacite}</span>
                          <div className="progress" style={{ width: '50px', height: '4px' }}>
                            <div className={`progress-bar${c.taux >= 90 ? ' full' : ''}`} style={{ width: `${Math.min(c.taux, 100)}%` }} />
                          </div>
                        </div>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </>
  );
}
