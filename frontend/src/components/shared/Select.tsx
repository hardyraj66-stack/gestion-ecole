import { SelectHTMLAttributes, forwardRef, ReactNode } from 'react';

export interface SelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
}

interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'children'> {
  label?: string;
  error?: string;
  hint?: string;
  options: SelectOption[];
  placeholder?: string;
  fullWidth?: boolean;
  badge?: ReactNode;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(({
  label,
  error,
  hint,
  options,
  placeholder,
  fullWidth = true,
  className = '',
  badge,
  ...props
}, ref) => {
  const selectClass = [
    'select',
    error ? 'input-error' : '',
    props.disabled ? 'input-readonly' : '',
    className,
  ].filter(Boolean).join(' ');

  const wrapperClass = [
    'form-group',
    fullWidth ? 'full-width' : '',
  ].filter(Boolean).join(' ');

  return (
    <div className={wrapperClass}>
      {label && (
        <label className="form-label">
          {label}
          {badge && <span className="label-badge">{badge}</span>}
        </label>
      )}
      <select ref={ref} className={selectClass} {...props}>
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((option) => (
          <option 
            key={option.value} 
            value={option.value}
            disabled={option.disabled}
          >
            {option.label}
          </option>
        ))}
      </select>
      {hint && !error && <p className="form-hint">{hint}</p>}
      {error && <p className="form-error">{error}</p>}
    </div>
  );
});

Select.displayName = 'Select';
