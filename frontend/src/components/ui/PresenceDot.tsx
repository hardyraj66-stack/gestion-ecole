interface PresenceDotProps {
  online: boolean;
  /** Libellé affiché à côté de la pastille (ex. « En ligne » / « Hors ligne »). */
  label: string;
  /** Nombre de sessions actives ; un badge « ×N » s'affiche si > 1. */
  sessions?: number;
  /** Texte d'infobulle optionnel (ex. dernière connexion quand hors ligne). */
  title?: string;
}

/**
 * Indicateur de présence : pastille verte (en ligne) / grise (hors ligne)
 * + libellé. Réutilisable dans n'importe quelle liste.
 */
export function PresenceDot({ online, label, sessions, title }: PresenceDotProps) {
  return (
    <span
      title={title}
      style={{ display: 'inline-flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}
    >
      <span
        aria-hidden
        style={{
          width: 9,
          height: 9,
          borderRadius: '50%',
          flex: '0 0 auto',
          background: online ? 'var(--success, #16a34a)' : 'var(--border, #cbd5e1)',
          boxShadow: online ? '0 0 0 3px rgba(22, 163, 74, 0.18)' : 'none',
        }}
      />
      <span style={{ fontSize: '0.85rem', opacity: online ? 1 : 0.6 }}>
        {label}
        {online && sessions && sessions > 1 ? ` ×${sessions}` : ''}
      </span>
    </span>
  );
}
