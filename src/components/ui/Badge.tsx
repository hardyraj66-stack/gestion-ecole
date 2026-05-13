import { BadgeVariant } from '../../types';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
}

export function Badge({ label, variant = 'default' }: BadgeProps) {
  return (
    <span className={`badge badge-${variant}`}>
      {label}
    </span>
  );
}
