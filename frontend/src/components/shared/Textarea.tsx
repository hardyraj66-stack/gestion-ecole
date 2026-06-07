import { TextareaHTMLAttributes, forwardRef } from 'react';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
  fullWidth?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(({
  label,
  error,
  hint,
  fullWidth = true,
  className = '',
  ...props
}, ref) => {
  const textareaClass = [
    'textarea',
    error ? 'input-error' : '',
    className,
  ].filter(Boolean).join(' ');

  const wrapperClass = [
    'form-group',
    fullWidth ? 'full-width' : '',
  ].filter(Boolean).join(' ');

  return (
    <div className={wrapperClass}>
      {label && <label className="form-label">{label}</label>}
      <textarea
        ref={ref}
        className={textareaClass}
        {...props}
      />
      {hint && !error && <p className="form-hint">{hint}</p>}
      {error && <p className="form-error">{error}</p>}
    </div>
  );
});

Textarea.displayName = 'Textarea';
