import { ReactNode } from 'react';

interface ListItemProps {
  title: string;
  subtitle?: string;
  selected?: boolean;
  onClick?: () => void;
  trailing?: ReactNode;
}

export function ListItem({ title, subtitle, selected, onClick, trailing }: ListItemProps) {
  return (
    <div onClick={onClick} className={`list-item ${selected ? 'list-item-selected' : ''}`}>
      <div className="list-item-content">
        <div className={`list-item-title ${selected ? 'list-item-title-selected' : ''}`}>{title}</div>
        {subtitle && <div className="list-item-subtitle">{subtitle}</div>}
      </div>
      {trailing && <div className="list-item-trailing">{trailing}</div>}
    </div>
  );
}
