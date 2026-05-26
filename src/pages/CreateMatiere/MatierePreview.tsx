import { useTranslation } from 'react-i18next';
import { Badge } from '../../components/ui/Badge';
import { CoefficientNiveau } from '../../types';

interface MatierePreviewProps {
  nom: string;
  code: string;
  coefficients: CoefficientNiveau[];
  description: string;
  couleur: string;
}

export function MatierePreview({ nom, code, coefficients, description, couleur }: MatierePreviewProps) {
  const { t } = useTranslation();

  return (
    <div className="preview-card" style={{ borderTopColor: couleur }}>
      <div className="preview-title">{t('matierePreview.apercu')}</div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
        <div
          style={{
            width: '48px', height: '48px', borderRadius: '8px',
            backgroundColor: `${couleur}20`, color: couleur,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 600, fontSize: '0.85rem', flexShrink: 0,
          }}
        >
          {code || t('matierePreview.codePlaceholder')}
        </div>
        <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>
          {nom || t('matierePreview.nomPlaceholder')}
        </h3>
      </div>

      {description && (
        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
          {description}
        </p>
      )}

      {coefficients.length > 0 ? (
        <div className="matiere-coef-display" style={{ marginTop: '0.5rem' }}>
          {coefficients.map(c => (
            <div key={c.niveau} className="matiere-coef-badge">
              <span className="matiere-coef-badge-niveau">{c.niveau}</span>
              <Badge label={`×${c.coefficient}`} variant="default" />
            </div>
          ))}
        </div>
      ) : (
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{t('matierePreview.aucunCoef')}</p>
      )}
    </div>
  );
}
