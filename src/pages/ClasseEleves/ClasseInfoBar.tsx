import { useCallback } from 'react';
import { readApi } from '../../services/readApi';
import { SearchInputSuggestions, Suggestion } from '../../components/shared/SearchInputSuggestions';
import { ProgressBar } from '../../components/shared/ProgressBar';
import { Badge } from '../../components/ui/Badge';
import { Icon } from '../../components/shared/Icon';

interface ClasseInfoBarProps {
  classe: any;
  filteredCount: number;
  totalCount: number;
  inputValue: string;
  hasFilter: boolean;
  onInputChange: (value: string) => void;
  onCommit: (value: string) => void;
  onSuggestionSelect: (eleveId: string, label: string) => void;
  onReset: () => void;
}

export function ClasseInfoBar({ classe, filteredCount, totalCount, inputValue, hasFilter, onInputChange, onCommit, onSuggestionSelect, onReset }: ClasseInfoBarProps) {
  const isVariable = classe.salle_type === 'variable';
  const pct = Math.round((totalCount / classe.capacite) * 100);
  const pleine = pct >= 100;

  const fetchSuggestions = useCallback(async (q: string): Promise<Suggestion[]> => {
    const res = await readApi.classeEleves(classe.source_id || classe.id, 1, 8, q);
    return (res.eleves || []).map((e: any) => ({ id: e.id, label: `${e.prenom} ${e.nom}`, sublabel: e.email || undefined }));
  }, [classe.source_id, classe.id]);

  const handleSelect = (s: Suggestion) => {
    onSuggestionSelect(s.id, s.label);
  };

  return (
    <div className="classe-eleves-infobar">
      <div className="classe-eleves-infobar-stats">
        <div className="classe-stat-item">
          <span className="classe-stat-label">Élèves</span>
          <span className="classe-stat-value">{totalCount} / {classe.capacite}</span>
          <div style={{ marginTop: '0.25rem' }}>
            <ProgressBar value={totalCount} max={classe.capacite} size="sm" />
          </div>
        </div>

        <div className="classe-stat-divider" />

        <div className="classe-stat-item">
          <span className="classe-stat-label">Salle</span>
          <span className="classe-stat-value">{isVariable ? 'Selon planning' : (classe.salle || '—')}</span>
        </div>

        <div className="classe-stat-divider" />

        <div className="classe-stat-item">
          <span className="classe-stat-label">Statut</span>
          <Badge
            label={pleine ? 'Complète' : `${classe.capacite - totalCount} place(s)`}
            variant={pleine ? 'danger' : 'success'}
          />
        </div>

        {hasFilter && (
          <>
            <div className="classe-stat-divider" />
            <div className="classe-stat-item">
              <span className="classe-stat-label">Résultats</span>
              <span className="classe-stat-value">{filteredCount}</span>
            </div>
          </>
        )}
      </div>

      <div className="classe-eleves-infobar-search" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <SearchInputSuggestions
          placeholder="Rechercher un élève…"
          value={inputValue}
          onChange={onInputChange}
          onSelect={handleSelect}
          onCommit={onCommit}
          fetchSuggestions={fetchSuggestions}
        />
        {hasFilter && (
          <button type="button" className="filter-reset-btn" onClick={onReset} style={{ flexShrink: 0 }}>
            <Icon path="M6 18L18 6M6 6l12 12" size={14} /> Réinitialiser
          </button>
        )}
      </div>
    </div>
  );
}
