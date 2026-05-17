import { InfoBar } from '../../components/shared/InfoBar';
import { SearchInput } from '../../components/shared/SearchInput';

interface ClasseInfoBarProps {
  classe: any;
  filteredCount: number;
  totalCount: number;
  searchTerm: string;
  onSearchChange: (value: string) => void;
}

export function ClasseInfoBar({ classe, filteredCount, totalCount, searchTerm, onSearchChange }: ClasseInfoBarProps) {
  const isVariable = classe.salle_type === 'variable';

  const items = [
    { label: 'Élèves :', value: `${filteredCount} / ${totalCount}` },
    { label: 'Capacité :', value: classe.capacite },
    { label: 'Salle :', value: isVariable ? 'Selon planning' : (classe.salle || '—') },
  ];

  return (
    <InfoBar items={items}>
      <div style={{ marginLeft: 'auto' }}>
        <SearchInput placeholder="Rechercher un élève…" value={searchTerm} onSearch={onSearchChange} />
      </div>
    </InfoBar>
  );
}
