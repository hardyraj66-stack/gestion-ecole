import { ReactNode } from 'react';

interface FormGridProps {
  children: ReactNode;
  columns?: 1 | 2 | 3 | 4;
  className?: string;
}

export function FormGrid({ children, columns = 2, className = '' }: FormGridProps) {
  const colClass = columns === 3 ? 'cols-3' : columns === 4 ? 'cols-4' : '';
  const gridClass = ['form-grid', colClass, className].filter(Boolean).join(' ');
  
  return <div className={gridClass}>{children}</div>;
}

interface FormSectionProps {
  title?: string;
  children: ReactNode;
  className?: string;
}

export function FormSection({ title, children, className = '' }: FormSectionProps) {
  return (
    <div className={`form-section ${className}`}>
      {title && <div className="form-section-title">{title}</div>}
      {children}
    </div>
  );
}

interface FormActionsProps {
  children: ReactNode;
  className?: string;
}

export function FormActions({ children, className = '' }: FormActionsProps) {
  return <div className={`form-actions ${className}`}>{children}</div>;
}
