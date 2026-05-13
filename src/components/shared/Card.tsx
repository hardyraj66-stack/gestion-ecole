import { ReactNode, CSSProperties } from 'react';
import { Link } from 'react-router-dom';

interface CardProps {
  children: ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  borderTop?: string;
  onClick?: () => void;
  style?: CSSProperties;
}

export function Card({ 
  children, 
  className = '', 
  padding = 'md',
  borderTop,
  onClick,
  style: customStyle,
}: CardProps) {
  const paddingClass = padding !== 'md' ? `card-padding-${padding}` : '';
  const cardClass = ['card', paddingClass, className].filter(Boolean).join(' ');
  
  const style: CSSProperties = {
    ...customStyle,
    ...(borderTop ? { borderTop: `4px solid ${borderTop}` } : {}),
  };

  return (
    <div className={cardClass} style={style} onClick={onClick}>
      {children}
    </div>
  );
}

interface CardHeaderProps {
  title: string;
  action?: ReactNode;
  linkTo?: string;
  linkText?: string;
}

export function CardHeader({ title, action, linkTo, linkText }: CardHeaderProps) {
  return (
    <div className="card-header">
      <h3 className="card-title">{title}</h3>
      {action}
      {linkTo && linkText && (
        <Link to={linkTo} className="link-primary">
          {linkText}
        </Link>
      )}
    </div>
  );
}

interface AddCardProps {
  onClick?: () => void;
  to?: string;
  label: string;
}

export function AddCard({ onClick, to, label }: AddCardProps) {
  const content = (
    <>
      <div className="add-card-icon">+</div>
      <span className="add-card-text">{label}</span>
    </>
  );

  if (to) {
    return (
      <Link to={to} className="add-card">
        {content}
      </Link>
    );
  }

  return (
    <div className="add-card" onClick={onClick}>
      {content}
    </div>
  );
}
