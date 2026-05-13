import { Trimestre } from '../../types';

interface TrimestreTabsProps {
  selected: Trimestre;
  onChange: (trimestre: Trimestre) => void;
}

export function TrimestreTabs({ selected, onChange }: TrimestreTabsProps) {
  const trimestres: Trimestre[] = [1, 2, 3];

  return (
    <div className="trimestre-tabs">
      {trimestres.map(t => (
        <button
          key={t}
          type="button"
          className={`trimestre-tab ${selected === t ? 'active' : ''}`}
          onClick={() => onChange(t)}
        >
          Trimestre {t}
        </button>
      ))}
    </div>
  );
}
