import { ReactNode } from 'react';

type AlertVariant = 'success' | 'error' | 'warning' | 'info';

interface AlertProps {
  variant: AlertVariant;
  children: ReactNode;
  icon?: boolean;
  className?: string;
}

const icons: Record<AlertVariant, string> = {
  success: 'M5 13l4 4L19 7',
  error: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
  warning: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
  info: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
};

export function Alert({ variant, children, icon = true, className = '' }: AlertProps) {
  const alertClass = ['alert', `alert-${variant}`, className].filter(Boolean).join(' ');

  return (
    <div className={alertClass}>
      {icon && (
        <svg 
          width="18" 
          height="18" 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor" 
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d={icons[variant]} />
        </svg>
      )}
      <span>{children}</span>
    </div>
  );
}
