import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { API_BASE_URL } from '../../config/api';
import { getToken } from '../../services/authStorage';

interface ExportMenuProps {
  csvUrl: string;
  xlsxUrl: string;
  label?: string;
}

export function ExportMenu({ csvUrl, xlsxUrl, label }: ExportMenuProps) {
  const { t } = useTranslation();
  const resolvedLabel = label ?? t('common.exporter');
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const download = (path: string) => {
    // window.open ne permet pas d'en-tête Authorization → on passe le token en query param,
    // accepté en repli par le JwtAuthGuard côté serveur.
    const token = getToken();
    const sep = path.includes('?') ? '&' : '?';
    const url = `${API_BASE_URL}${path}${token ? `${sep}token=${encodeURIComponent(token)}` : ''}`;
    window.open(url, '_blank');
    setOpen(false);
  };

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-block' }}>
      <button
        className="btn btn-outline btn-sm"
        onClick={() => setOpen(o => !o)}
        type="button"
        title={resolvedLabel}
      >
        <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ marginRight: 6 }}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        {resolvedLabel}
        <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ marginLeft: 4 }}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', right: 0, zIndex: 200,
          background: 'var(--card-bg, #fff)', border: '1px solid var(--border-color, #e2e8f0)',
          borderRadius: 8, boxShadow: '0 8px 24px rgba(0,0,0,.12)', minWidth: 160, overflow: 'hidden',
        }}>
          <button
            className="export-menu-item"
            onClick={() => download(csvUrl)}
            type="button"
          >
            <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            CSV
          </button>
          <button
            className="export-menu-item"
            onClick={() => download(xlsxUrl)}
            type="button"
          >
            <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M3 14h18M10 3v18M14 3v18M5 3h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2z" />
            </svg>
            Excel (XLS)
          </button>
        </div>
      )}
    </div>
  );
}
