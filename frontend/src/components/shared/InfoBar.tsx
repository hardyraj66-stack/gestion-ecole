import { ReactNode } from 'react';

interface InfoBarItem {
  label: string;
  value: ReactNode;
}

interface InfoBarProps {
  items: InfoBarItem[];
  children?: ReactNode;
}

export function InfoBar({ items, children }: InfoBarProps) {
  return (
    <div className="info-bar">
      {items.map((item, index) => (
        <div key={index} className="info-bar-item">
          <span className="info-bar-label">{item.label}</span>
          <span className="info-bar-value">{item.value}</span>
        </div>
      ))}
      {children}
    </div>
  );
}
