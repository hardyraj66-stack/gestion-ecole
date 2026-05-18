import { useState, useCallback, useRef } from 'react';
import { Matiere, Trimestre } from '../../types';
import { Card } from '../../components/shared/Card';
import { Select, SelectOption } from '../../components/shared/Select';
import { Button } from '../../components/shared/Button';
import { Popover } from '../../components/shared/Popover';
import { SearchInputSuggestions, Suggestion } from '../../components/shared/SearchInputSuggestions';
import { Badge } from '../../components/ui/Badge';
import { Icon } from '../../components/shared/Icon';
import { readApi } from '../../services/readApi';

interface NiveauItem { niveau: string; count: number; }
interface ClasseItem { id: string; nom: string; nb_eleves: number; capacite: number; places_restantes: number; taux: number; pleine: boolean; }

interface NotesFiltersProps {
  matieres: Matiere[];
  selectedClasseId: string;
  selectedClasseNom: string;
  selectedNiveau: string;
  selectedMatiereId: string;
  selectedMatiereName: string;
  selectedTrimestre: Trimestre;
  onNiveauClasseChange: (niveau: string, classeId: string, classeNom: string) => void;
  onMatiereChange: (id: string, nom: string) => void;
  onTrimestreChange: (t: Trimestre) => void;
  onLoad: () => void;
  loading: boolean;
}

const TRIMESTRE_OPTIONS: SelectOption[] = [
  { value: 1, label: 'Trimestre 1' },
  { value: 2, label: 'Trimestre 2' },
  { value: 3, label: 'Trimestre 3' },
];

export function NotesFilters({
  matieres,
  selectedClasseId,
  selectedClasseNom,
  selectedNiveau,
  selectedMatiereId,
  selectedMatiereName,
  selectedTrimestre,
  onNiveauClasseChange,
  onMatiereChange,
  onTrimestreChange,
  onLoad,
  loading,
}: NotesFiltersProps) {
  const [niveaux, setNiveaux] = useState<NiveauItem[]>([]);
  const [classes, setClasses] = useState<ClasseItem[]>([]);
  const [loadingNiveaux, setLoadingNiveaux] = useState(false);
  const [loadingClasses, setLoadingClasses] = useState(false);
  const [popoverNiveau, setPopoverNiveau] = useState(false);
  const [popoverClasses, setPopoverClasses] = useState(false);
  const [matiereQuery, setMatiereQuery] = useState(selectedMatiereName);
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
    onNiveauClasseChange(internalNiveau.current, classe.id, classe.nom);
    setPopoverClasses(false);
  };

  const fetchMatieresSuggestions = useCallback(async (query: string): Promise<Suggestion[]> => {
    const q = query.toLowerCase();
    return matieres
      .filter(m => m.nom.toLowerCase().includes(q) || m.code.toLowerCase().includes(q))
      .slice(0, 8)
      .map(m => ({ id: m.id, label: m.nom, sublabel: m.code }));
  }, [matieres]);

  const handleMatiereSelect = (s: Suggestion) => {
    setMatiereQuery(s.label);
    onMatiereChange(s.id, s.label);
  };

  const handleMatiereQueryChange = (val: string) => {
    setMatiereQuery(val);
    if (!val) onMatiereChange('', '');
  };

  const niveauLabel = selectedNiveau
    ? `${selectedNiveau}${selectedClasseNom ? ` · ${selectedClasseNom}` : ''}`
    : 'Niveau / Classe';

  const isDisabled = !selectedClasseId || !selectedMatiereId;

  return (
    <Card style={{ marginBottom: '1.5rem' }}>
      <h3 className="card-title" style={{ marginBottom: '1rem' }}>Sélection</h3>

      <div className="notes-filters-row">
        {/* Sélection niveau → classe via popover */}
        <div className="notes-filter-group">
          <label className="notes-filter-label">Classe *</label>
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
                          <div className="classes-popover-item-right">
                            <span className="classes-popover-item-count">{c.nb_eleves}/{c.capacite}</span>
                          </div>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Recherche matière avec autocomplete */}
        <div className="notes-filter-group">
          <label className="notes-filter-label">Matière *</label>
          <SearchInputSuggestions
            placeholder="Rechercher une matière…"
            value={matiereQuery}
            onChange={handleMatiereQueryChange}
            onSelect={handleMatiereSelect}
            fetchSuggestions={fetchMatieresSuggestions}
            debounceMs={150}
          />
        </div>

        {/* Trimestre */}
        <div className="notes-filter-group">
          <label className="notes-filter-label">Trimestre</label>
          <Select
            label=""
            value={selectedTrimestre}
            onChange={e => onTrimestreChange(Number(e.target.value) as Trimestre)}
            options={TRIMESTRE_OPTIONS}
          />
        </div>

        {/* Bouton charger */}
        <div className="notes-filter-group notes-filter-action">
          <Button
            variant="primary"
            onClick={onLoad}
            disabled={isDisabled}
            loading={loading}
          >
            Charger les élèves →
          </Button>
        </div>
      </div>
    </Card>
  );
}
