import { ReactNode } from 'react';

interface StatItemProps {
  label: string;
  value: ReactNode;
}

export function StatItem({ label, value }: StatItemProps) {
  return (
    <div className="stat-item">
      <span className="stat-item-label">{label}</span>
      <p className="stat-item-value">{value}</p>
    </div>
  );
}
