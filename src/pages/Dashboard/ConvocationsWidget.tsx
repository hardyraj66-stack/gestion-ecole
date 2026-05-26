import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Avatar } from '../../components/shared/Avatar';
import { Badge } from '../../components/ui/Badge';
import { Icon } from '../../components/shared/Icon';
import { getInitials, formatDate } from '../../utils/helpers';

interface ConvocationItem {
  id: string;
  eleve_id: string;
  date: string;
  raison: string;
  effectuee: boolean;
  nb_avertissements: number;
  periode: 'yesterday' | 'today' | 'upcoming';
  eleve: {
    id: string;
    nom: string;
    prenom: string;
    genre: 'M' | 'F';
    classe_nom: string;
  } | null;
}

interface Props {
  convocations: ConvocationItem[];
}

export function ConvocationsWidget({ convocations }: Props) {
  const { t } = useTranslation();
  if (convocations.length === 0) return null;

  const PERIODE_LABEL: Record<string, { label: string; variant: any }> = {
    yesterday: { label: t('dashboard.convocations.hier'),       variant: 'default' },
    today:     { label: t('dashboard.convocations.aujourdhui'), variant: 'warning' },
    upcoming:  { label: t('dashboard.convocations.aVenir'),     variant: 'info' },
  };

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Icon path="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" size={16} />
          {t('dashboard.convocations.titre')}
        </h3>
        <span className="convoc-count-badge">{convocations.length}</span>
      </div>

      <div className="convoc-list">
        {convocations.map(c => {
          const periode = PERIODE_LABEL[c.periode];
          const eleve = c.eleve;
          return (
            <div key={c.id} className={`convoc-item${c.effectuee ? ' convoc-item-done' : ''}`}>
              <div className="convoc-item-left">
                {eleve ? (
                  <Avatar initiales={getInitials(eleve)} genre={eleve.genre} size="sm" />
                ) : (
                  <div className="convoc-avatar-placeholder" />
                )}
                <div className="convoc-item-info">
                  {eleve ? (
                    <Link to={`/eleves/${eleve.id}`} className="convoc-eleve-name">
                      {eleve.prenom} {eleve.nom}
                    </Link>
                  ) : (
                    <span className="convoc-eleve-name">{t('dashboard.convocations.eleveInconnu')}</span>
                  )}
                  <div className="convoc-meta">
                    {eleve?.classe_nom && <span>{eleve.classe_nom} · </span>}
                    <span>{c.raison}</span>
                  </div>
                </div>
              </div>
              <div className="convoc-item-right">
                <Badge label={periode.label} variant={periode.variant} />
                {c.effectuee && <Badge label={t('dashboard.convocations.effectuee')} variant="success" />}
                {c.nb_avertissements >= 3 && !c.effectuee && (
                  <Badge label={t('dashboard.convocations.avertissements', { count: c.nb_avertissements })} variant="danger" />
                )}
                <span className="convoc-date">{formatDate(c.date)}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
