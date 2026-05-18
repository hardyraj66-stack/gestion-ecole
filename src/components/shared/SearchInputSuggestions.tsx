import { useState, useRef, useEffect, useCallback } from 'react';
import { Icon, Icons } from './Icon';

export interface Suggestion {
  id: string;
  label: string;
  sublabel?: string;
}

interface SearchInputSuggestionsProps {
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  onSelect?: (suggestion: Suggestion) => void;
  fetchSuggestions: (query: string) => Promise<Suggestion[]>;
  debounceMs?: number;
}

export function SearchInputSuggestions({
  placeholder = 'Rechercher…',
  value,
  onChange,
  onSelect,
  fetchSuggestions,
  debounceMs = 250,
}: SearchInputSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const runFetch = useCallback(async (q: string) => {
    if (q.trim().length < 2) { setSuggestions([]); setOpen(false); return; }
    const results = await fetchSuggestions(q);
    setSuggestions(results);
    setOpen(results.length > 0);
    setActiveIdx(-1);
  }, [fetchSuggestions]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value;
    onChange(q);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => runFetch(q), debounceMs);
  };

  const handleSelect = (s: Suggestion) => {
    onChange(s.label);
    setSuggestions([]);
    setOpen(false);
    onSelect?.(s);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIdx(i => Math.min(i + 1, suggestions.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIdx(i => Math.max(i - 1, -1)); }
    else if (e.key === 'Enter' && activeIdx >= 0) { e.preventDefault(); handleSelect(suggestions[activeIdx]); }
    else if (e.key === 'Escape') { setOpen(false); setActiveIdx(-1); }
  };

  // Fermer si clic extérieur
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false); setActiveIdx(-1);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleClear = () => {
    onChange('');
    setSuggestions([]);
    setOpen(false);
  };

  return (
    <div ref={containerRef} className="search-suggestions-container">
      <div className="search-input">
        <Icon path={Icons.search} size={18} />
        <input
          type="text"
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={() => { if (suggestions.length > 0) setOpen(true); }}
          placeholder={placeholder}
          autoComplete="off"
        />
        {value && (
          <button type="button" className="search-clear-btn" onClick={handleClear} tabIndex={-1}>✕</button>
        )}
      </div>

      {open && (
        <ul className="search-suggestions-list" role="listbox">
          {suggestions.map((s, idx) => (
            <li
              key={s.id}
              role="option"
              aria-selected={idx === activeIdx}
              className={`search-suggestion-item${idx === activeIdx ? ' search-suggestion-item-active' : ''}`}
              onMouseDown={() => handleSelect(s)}
            >
              <Icon path={Icons.search} size={14} />
              <div className="search-suggestion-text">
                <span className="search-suggestion-label">{s.label}</span>
                {s.sublabel && <span className="search-suggestion-sub">{s.sublabel}</span>}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
