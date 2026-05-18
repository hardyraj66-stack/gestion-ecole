import { useState, useCallback, useRef, useEffect } from 'react';
import { readApi } from '../../services/readApi';
import { FilterBar } from '../../components/shared/FilterBar';
import { Popover } from '../../components/shared/Popover';
import { SearchInputSuggestions, Suggestion } from '../../components/shared/SearchInputSuggestions';
import { Icon } from '../../components/shared/Icon';
import { Badge } from '../../components/ui/Badge';

interface NiveauItem { niveau: string; count: number; }
interface ClasseItem { id: string; nom: string; nb_eleves: number; capacite: number; places_restantes: number; taux: number; pleine: boolean; }

interface ElevesFiltersBarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onSuggestionSelect: (eleveId: string) => void;
  selectedClasseId: string;
  selectedClasseNom: string;
  selectedNiveau: string;
  onNiveauClasseChange: (niveauLabel: string, classeId: string, classeNom: string) => void;
  onReset: () => void;
  count: number;
  hasEleveFilter: boolean;
}

export function ElevesFiltersBar({
  searchTerm,
  onSearchChange,
  onSuggestionSelect,
  selectedClasseId,
  selectedClasseNom,
  selectedNiveau,
  onNiveauClasseChange,
  onReset,
  count,
  hasEleveFilter,
}: ElevesFiltersBarProps) {
  const [niveaux, setNiveaux] = useState<NiveauItem[]>([]);
  const [classes, setClasses] = useState<ClasseItem[]>([]);
  const [loadingNiveaux, setLoadingNiveaux] = useState(false);
  const [loadingClasses, setLoadingClasses] = useState(false);
  const [popoverNiveau, setPopoverNiveau] = useState(false);
  const [popoverClasses, setPopoverClasses] = useState(false);
  const fetchedNiveaux = useRef(false);

  // Charge les niveaux une seule fois à l'ouverture du popover
  const openNiveauPopover = async () => {
    setPopoverNiveau(true);
    if (fetchedNiveaux.current) return;
    fetchedNiveaux.current = true;
    setLoadingNiveaux(true);
    const data = await readApi.niveaux();
    if (Array.isArray(data)) setNiveaux(data);
    setLoadingNiveaux(false);
  };

  // Charge les classes du niveau sélectionné
  const handleSelectNiveau = async (niveau: string) => {
    setPopoverNiveau(false);
    setLoadingClasses(true);
    setPopoverClasses(true);
    const data = await readApi.classesParNiveau(niveau);
    if (data?.classes) setClasses(data.classes);
    setLoadingClasses(false);
  };

  const handleSelectClasse = (classe: ClasseItem) => {
    onNiveauClasseChange(selectedNiveau || classes[0]?.nom || '', classe.id, classe.nom);
    setPopoverClasses(false);
  };

  // Suggestions de recherche : filtre côté client sur les noms
  const fetchSuggestions = useCallback(async (query: string): Promise<Suggestion[]> => {
    const data = await readApi.elevesList(1, 8, query, '');
    if (!data?.eleves) return [];
    return (data.eleves as any[]).map((e: any) => ({
      id: e.id,
      label: `${e.prenom} ${e.nom}`,
      sublabel: e.classe_nom || undefined,
    }));
  }, []);

  const handleSuggestionSelect = (s: Suggestion) => {
    onSuggestionSelect(s.id);
  };

  const hasFilter = !!selectedClasseId || !!searchTerm || hasEleveFilter;

  // Fermer popover classes si clic extérieur (géré par Popover, mais on le ferme aussi au reset)
  useEffect(() => {
    if (!selectedNiveau) setPopoverClasses(false);
  }, [selectedNiveau]);

  const niveauLabel = selectedNiveau
    ? `${selectedNiveau}${selectedClasseNom ? ` · ${selectedClasseNom}` : ''}`
    : 'Niveau / Classe';

  return (
    <FilterBar count={count} countLabel="élève(s)">
      {/* Recherche avec auto-complétion */}
      <SearchInputSuggestions
        placeholder="Rechercher par nom ou prénom…"
        value={searchTerm}
        onChange={onSearchChange}
        onSelect={handleSuggestionSelect}
        fetchSuggestions={fetchSuggestions}
      />

      {/* Filtre Niveau → Popover niveaux */}
      <Popover
        align="left"
        open={popoverNiveau}
        onClose={() => setPopoverNiveau(false)}
        trigger={
          <button
            type="button"
            className={`niveau-filter-btn${selectedNiveau ? ' niveau-filter-btn-active' : ''}`}
            onClick={openNiveauPopover}
          >
            <Icon path="M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4" size={14} />
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

      {/* Popover classes du niveau sélectionné */}
      {popoverClasses && (
        <div className="classes-popover-overlay" onClick={() => setPopoverClasses(false)}>
          <div className="classes-popover" onClick={e => e.stopPropagation()}>
            <div className="classes-popover-header">
              <button type="button" className="classes-popover-back" onClick={() => { setPopoverClasses(false); setPopoverNiveau(true); }}>
                <Icon path="M15 19l-7-7 7-7" size={16} /> Niveaux
              </button>
              <span className="classes-popover-title">{selectedNiveau}</span>
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
                      <div className="classes-popover-item-right">
                        <span className="classes-popover-item-count">{c.nb_eleves}/{c.capacite}</span>
                        <div className="progress" style={{ width: '50px', height: '4px' }}>
                          <div className={`progress-bar${c.taux >= 90 ? ' full' : ''}`} style={{ width: `${Math.min(c.taux, 100)}%` }} />
                        </div>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {/* Réinitialiser */}
      {hasFilter && (
        <button type="button" className="filter-reset-btn" onClick={onReset}>
          <Icon path="M6 18L18 6M6 6l12 12" size={14} /> Réinitialiser
        </button>
      )}
    </FilterBar>
  );
}
