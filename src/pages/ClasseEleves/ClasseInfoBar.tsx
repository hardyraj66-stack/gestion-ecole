import { Classe } from '../../types';
import { InfoBar } from '../../components/shared/InfoBar';
import { SearchInput } from '../../components/shared/SearchInput';

interface ClasseInfoBarProps {
  classe: Classe;
  filteredCount: number;
  totalCount: number;
  searchTerm: string;
  onSearchChange: (value: string) => void;
}

export function ClasseInfoBar({ classe, filteredCount, totalCount, searchTerm, onSearchChange }: ClasseInfoBarProps) {
  const items = [
    { label: 'Élèves :', value: `${filteredCount} / ${totalCount}` },
    { label: 'Capacité :', value: classe.capacite },
    { label: 'Salle :', value: classe.salle },
  ];

  return (
    <InfoBar items={items}>
      <div style={{ marginLeft: 'auto' }}>
        <SearchInput
          placeholder="Rechercher un élève…"
          value={searchTerm}
          onSearch={onSearchChange}
        />
      </div>
    </InfoBar>
  );
}
