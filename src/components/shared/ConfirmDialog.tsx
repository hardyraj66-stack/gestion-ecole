import { createContext, useContext, useState, useCallback, ReactNode, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

// ============ TYPES ============
interface ConfirmOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
}

type ConfirmArg = ConfirmOptions | string;

interface ConfirmContextType {
  confirm: (options: ConfirmArg) => Promise<boolean>;
}

// ============ CONTEXT ============
const ConfirmContext = createContext<ConfirmContextType | undefined>(undefined);

export function useConfirm() {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error('useConfirm must be used within ConfirmProvider');
  }
  return context.confirm;
}

// ============ PROVIDER ============
export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<{
    open: boolean;
    options: ConfirmOptions;
    resolve: ((value: boolean) => void) | null;
  }>({
    open: false,
    options: { message: '' },
    resolve: null,
  });

  const confirm = useCallback((arg: ConfirmArg): Promise<boolean> => {
    const options: ConfirmOptions = typeof arg === 'string' ? { message: arg } : arg;
    return new Promise((resolve) => {
      setState({ open: true, options, resolve });
    });
  }, []);

  const handleClose = useCallback((result: boolean) => {
    state.resolve?.(result);
    setState({ open: false, options: { message: '' }, resolve: null });
  }, [state.resolve]);

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      {state.open && (
        <ConfirmDialogUI
          {...state.options}
          onConfirm={() => handleClose(true)}
          onCancel={() => handleClose(false)}
        />
      )}
    </ConfirmContext.Provider>
  );
}

// ============ UI ============
interface ConfirmDialogUIProps extends ConfirmOptions {
  onConfirm: () => void;
  onCancel: () => void;
}

const variantConfig = {
  danger: {
    icon: 'M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16',
    iconBg: 'var(--danger-light)',
    iconColor: 'var(--danger)',
    btnBg: 'var(--danger)',
    btnHover: '#b91c1c',
  },
  warning: {
    icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
    iconBg: 'var(--warning-light)',
    iconColor: 'var(--warning)',
    btnBg: 'var(--warning)',
    btnHover: '#b45309',
  },
  info: {
    icon: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
    iconBg: 'var(--info-light)',
    iconColor: 'var(--info)',
    btnBg: 'var(--info)',
    btnHover: '#0e7490',
  },
};

function ConfirmDialogUI({
  title,
  message,
  confirmText,
  cancelText,
  variant = 'danger',
  onConfirm,
  onCancel,
}: ConfirmDialogUIProps) {
  const { t } = useTranslation();
  const config = variantConfig[variant];
  const confirmRef = useRef<HTMLButtonElement>(null);

  const resolvedConfirmText = confirmText ?? t('common.confirmer');
  const resolvedCancelText = cancelText ?? t('common.annuler');

  useEffect(() => {
    confirmRef.current?.focus();
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onCancel]);

  return (
    <div className="confirm-overlay" onClick={onCancel}>
      <div className="confirm-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="confirm-body">
          <div className="confirm-icon" style={{ background: config.iconBg }}>
            <svg
              width="24"
              height="24"
              fill="none"
              viewBox="0 0 24 24"
              stroke={config.iconColor}
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d={config.icon} />
            </svg>
          </div>
          <div className="confirm-content">
            {title && <h3 className="confirm-title">{title}</h3>}
            <p className="confirm-message">{message}</p>
          </div>
        </div>
        <div className="confirm-actions">
          <button className="confirm-btn confirm-btn-cancel" onClick={onCancel}>
            {resolvedCancelText}
          </button>
          <button
            ref={confirmRef}
            className="confirm-btn confirm-btn-confirm"
            style={{ background: config.btnBg }}
            onClick={onConfirm}
          >
            {resolvedConfirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
