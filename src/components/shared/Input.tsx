import { InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  icon?: React.ReactNode;
  fullWidth?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({
  label,
  error,
  hint,
  icon,
  fullWidth = true,
  className = '',
  readOnly,
  ...props
}, ref) => {
  const inputClass = [
    'input',
    error ? 'input-error' : '',
    readOnly ? 'input-readonly' : '',
    icon ? 'input-with-icon' : '',
    className,
  ].filter(Boolean).join(' ');

  const wrapperClass = [
    'form-group',
    fullWidth ? 'full-width' : '',
  ].filter(Boolean).join(' ');

  return (
    <div className={wrapperClass}>
      {label && <label className="form-label">{label}</label>}
      <div className={icon ? 'input-wrapper' : ''}>
        {icon && <span className="input-icon">{icon}</span>}
        <input
          ref={ref}
          className={inputClass}
          readOnly={readOnly}
          {...props}
        />
      </div>
      {hint && !error && <p className="form-hint">{hint}</p>}
      {error && <p className="form-error">{error}</p>}
    </div>
  );
});

Input.displayName = 'Input';
