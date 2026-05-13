import { ButtonHTMLAttributes, ReactNode } from 'react';
import { Link } from 'react-router-dom';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'danger' | 'link' | 'icon';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonBaseProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: ReactNode;
  icon?: ReactNode;
  loading?: boolean;
  fullWidth?: boolean;
}

interface ButtonAsButtonProps extends ButtonBaseProps, Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  as?: 'button';
  to?: never;
}

interface ButtonAsLinkProps extends ButtonBaseProps {
  as: 'link';
  to: string;
  disabled?: boolean;
}

type ButtonProps = ButtonAsButtonProps | ButtonAsLinkProps;

export function Button({
  variant = 'primary',
  size = 'md',
  children,
  icon,
  loading,
  fullWidth,
  ...props
}: ButtonProps) {
  const baseClass = 'btn';
  const variantClass = `btn-${variant}`;
  const sizeClass = size !== 'md' ? `btn-${size}` : '';
  const widthClass = fullWidth ? 'btn-full' : '';
  
  const className = [baseClass, variantClass, sizeClass, widthClass]
    .filter(Boolean)
    .join(' ');

  const content = (
    <>
      {loading && <span className="btn-spinner" />}
      {icon && !loading && <span className="btn-icon-wrapper">{icon}</span>}
      {children}
    </>
  );

  if (props.as === 'link') {
    const { to, disabled, as: _, ...linkProps } = props;
    return (
      <Link 
        to={to} 
        className={`${className} ${disabled ? 'btn-disabled' : ''}`}
        onClick={disabled ? (e) => e.preventDefault() : undefined}
        {...linkProps as any}
      >
        {content}
      </Link>
    );
  }

  const { as: _, ...buttonProps } = props;
  return (
    <button 
      className={className} 
      disabled={loading || props.disabled}
      {...buttonProps}
    >
      {content}
    </button>
  );
}
