import { ReactNode } from 'react';

interface FilterBarProps {
  children: ReactNode;
  count?: number;
  countLabel?: string;
}

export function FilterBar({ children, count, countLabel = 'résultat(s)' }: FilterBarProps) {
  return (
    <div className="filters-bar">
      {children}
      {count !== undefined && (
        <span className="filters-count">
          {count} {countLabel}
        </span>
      )}
    </div>
  );
}
