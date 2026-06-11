import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { API_BASE_URL } from '../../config/api';
import { PageHeader } from '../../components/ui/PageHeader';
import { Badge } from '../../components/ui/Badge';

interface AuditEntry {
  id: string;
  action: string;
  meta: Record<string, any>;
  createdAt: string;
  by: string;
  target: string;
}

const ACTION_LABELS: Record<string, { label: string; variant: 'success' | 'info' | 'warning' | 'default' }> = {
  'user.create': { label: 'Création de compte', variant: 'success' },
  'user.update': { label: 'Modification', variant: 'info' },
  'user.delete': { label: 'Suppression', variant: 'warning' },
  'user.restore': { label: 'Restauration', variant: 'info' },
  'user.reset_password': { label: 'Réinitialisation mot de passe', variant: 'warning' },
};

export function Audit() {
  const { t } = useTranslation();
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE_URL}/audit`)
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => setEntries(Array.isArray(d) ? d : []))
      .catch(() => setEntries([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="page">
      <PageHeader title={t('audit.titre', "Journal d'activité")} subtitle={t('audit.sousTitre', 'Historique des actions sur les comptes')} />

      <div className="table-wrapper">
        <table className="table">
          <thead>
            <tr>
              <th>{t('audit.date', 'Date')}</th>
              <th>{t('audit.action', 'Action')}</th>
              <th>{t('audit.par', 'Par')}</th>
              <th>{t('audit.cible', 'Compte concerné')}</th>
              <th>{t('audit.details', 'Détails')}</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} style={{ textAlign: 'center', padding: '1.5rem' }}>…</td></tr>
            ) : entries.length === 0 ? (
              <tr><td colSpan={5} style={{ textAlign: 'center', padding: '1.5rem' }}>{t('audit.vide', 'Aucune activité enregistrée.')}</td></tr>
            ) : (
              entries.map((e) => {
                const a = ACTION_LABELS[e.action] || { label: e.action, variant: 'default' as const };
                const details = Object.entries(e.meta || {})
                  .filter(([, v]) => v !== undefined && v !== null && v !== '')
                  .map(([k, v]) => `${k}: ${v}`)
                  .join(', ');
                return (
                  <tr key={e.id}>
                    <td style={{ whiteSpace: 'nowrap', fontSize: '0.85rem' }}>
                      {new Date(e.createdAt).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })}
                    </td>
                    <td><Badge label={a.label} variant={a.variant} /></td>
                    <td>{e.by}</td>
                    <td>{e.target}</td>
                    <td style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{details || '—'}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
