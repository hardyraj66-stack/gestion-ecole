import { StatusDot } from './StatusDot';

interface AuditEntryProps {
  details: string;
  date: string;
  context?: string;
  color: string;
}

const formatDateTime = (iso: string) => {
  const d = new Date(iso);
  return `${d.toLocaleDateString('fr-FR')} à ${d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
};

export function AuditEntry({ details, date, context, color }: AuditEntryProps) {
  return (
    <div className="audit-entry">
      <StatusDot color={color} />
      <div className="audit-entry-content">
        <p className="audit-entry-details">{details}</p>
        <p className="audit-entry-meta">
          {context && <>{context} · </>}{formatDateTime(date)}
        </p>
      </div>
    </div>
  );
}
