import { ReactNode, useEffect, useRef } from 'react';

interface PopoverProps {
  trigger: ReactNode;
  children: ReactNode;
  open: boolean;
  onClose: () => void;
  align?: 'left' | 'right';
}

export function Popover({ trigger, children, open, onClose, align = 'left' }: PopoverProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  return (
    <div ref={ref} className="popover-container">
      {trigger}
      {open && (
        <div className={`popover-content popover-${align}`}>
          {children}
        </div>
      )}
    </div>
  );
}
