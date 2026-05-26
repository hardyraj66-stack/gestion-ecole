import { useTranslation } from 'react-i18next';
import { Trimestre } from '../../types';

interface TrimestreTabsProps {
  selected: Trimestre;
  onChange: (trimestre: Trimestre) => void;
}

export function TrimestreTabs({ selected, onChange }: TrimestreTabsProps) {
  const { t } = useTranslation();
  const trimestres: Trimestre[] = [1, 2, 3];

  return (
    <div className="trimestre-tabs">
      {trimestres.map(tr => (
        <button
          key={tr}
          type="button"
          className={`trimestre-tab ${selected === tr ? 'active' : ''}`}
          onClick={() => onChange(tr)}
        >
          {t('bulletin.trimestre', { t: tr })}
        </button>
      ))}
    </div>
  );
}
