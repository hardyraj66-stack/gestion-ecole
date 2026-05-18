import { useState, useRef, useEffect, useCallback } from 'react';
import { Icon, Icons } from './Icon';

function getInitial(label: string): string {
  const parts = label.trim().split(' ');
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return label.slice(0, 2).toUpperCase();
}

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
  onCommit?: (value: string) => void;
  fetchSuggestions: (query: string) => Promise<Suggestion[]>;
  debounceMs?: number;
}

export function SearchInputSuggestions({
  placeholder = 'Rechercher…',
  value,
  onChange,
  onSelect,
  onCommit,
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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIdx(i => Math.min(i + 1, suggestions.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIdx(i => Math.max(i - 1, -1)); }
    else if (e.key === 'Enter') {
      e.preventDefault();
      if (open && activeIdx >= 0) { handleSelect(suggestions[activeIdx]); }
      else { setOpen(false); onCommit?.(e.currentTarget.value); }
    }
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
              <div className="search-suggestion-avatar">{getInitial(s.label)}</div>
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
