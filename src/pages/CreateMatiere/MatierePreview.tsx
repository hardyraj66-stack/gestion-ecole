import { Badge } from '../../components/ui/Badge';

interface MatierePreviewProps {
  nom: string;
  code: string;
  coefficient: number;
  description: string;
  couleur: string;
}

export function MatierePreview({ nom, code, coefficient, description, couleur }: MatierePreviewProps) {
  return (
    <div className="preview-card" style={{ borderTopColor: couleur }}>
      <div className="preview-title">Aperçu</div>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
        <div
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '8px',
            backgroundColor: `${couleur}20`,
            color: couleur,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 600,
            fontSize: '0.85rem',
          }}
        >
          {code || 'CODE'}
        </div>
        <Badge label={`Coef. ${coefficient}`} variant="default" />
      </div>

      <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.5rem' }}>
        {nom || 'Nom de la matière'}
      </h3>

      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
        {description || 'Description…'}
      </p>
    </div>
  );
}
