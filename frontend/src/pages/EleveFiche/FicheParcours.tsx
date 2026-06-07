import { useTranslation } from 'react-i18next';
import { Inscription } from '../../types';
import { Card, CardHeader } from '../../components/shared/Card';
import { Badge } from '../../components/ui/Badge';

interface Props {
  inscriptions: Inscription[];
  readOnly: boolean;
}

export function FicheParcours({ inscriptions, readOnly }: Props) {
  const { t } = useTranslation();

  const sorted = [...inscriptions].sort((a, b) => b.ordre - a.ordre);

  if (sorted.length === 0) return null;

  return (
    <Card>
      <CardHeader title={t('fiche.parcours.titre', 'Parcours scolaire')} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {sorted.map((ins, idx) => (
          <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem 0', borderBottom: idx < sorted.length - 1 ? '1px solid var(--border)' : 'none' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 500, fontSize: '0.875rem' }}>
                {ins.classeId}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                Année : {ins.anneeScolaireId}
              </div>
            </div>
            <Badge
              label={ins.status === 'active' ? t('common.actif', 'Actif') : t('fiche.parcours.precedente', 'Précédente')}
              variant={ins.status === 'active' ? 'success' : 'default'}
            />
          </div>
        ))}
      </div>
    </Card>
  );
}
