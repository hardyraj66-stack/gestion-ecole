import { useEffect, useRef } from 'react';
import { Icon } from './Icon';

export interface DropdownMenuItem {
  label: string;
  icon?: string;
  onClick: () => void;
  variant?: 'default' | 'danger';
  separator?: boolean;
}

interface DropdownMenuProps {
  items: DropdownMenuItem[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  align?: 'left' | 'right';
  triggerLabel?: string;
}

export function DropdownMenu({ items, open, onOpenChange, align = 'right', triggerLabel = '⋯' }: DropdownMenuProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onOpenChange(false);
    };
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onOpenChange(false); };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [open, onOpenChange]);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={() => onOpenChange(!open)}
        style={{ background: 'none', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '0.4rem 0.6rem', cursor: 'pointer', color: 'var(--text-muted)', lineHeight: 1, fontSize: '1.1rem' }}
      >
        {triggerLabel}
      </button>
      {open && (
        <div style={{ position: 'absolute', [align]: 0, top: 'calc(100% + 4px)', background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius)', boxShadow: 'var(--card-shadow)', zIndex: 100, minWidth: 180, overflow: 'hidden' }}>
          {items.map((item, i) => (
            <button
              key={i}
              type="button"
              onClick={() => { item.onClick(); onOpenChange(false); }}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%',
                padding: '0.65rem 1rem', background: 'none', border: 'none',
                borderBottom: item.separator || i < items.length - 1 ? '1px solid var(--border-color)' : 'none',
                cursor: 'pointer',
                color: item.variant === 'danger' ? 'var(--danger)' : 'var(--text)',
                fontSize: '0.875rem', textAlign: 'left',
              }}
            >
              {item.icon && <Icon path={item.icon} size={15} />}
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
