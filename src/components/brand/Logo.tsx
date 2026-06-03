import { BrandIcon } from './BrandIcon';
import './Logo.css';

interface LogoProps {
  /** Taille de l'icône en px (la wordmark s'adapte). */
  iconSize?: number;
  /** Disposition icône + texte. */
  layout?: 'horizontal' | 'vertical';
  /** Fond sur lequel le logo est posé (ajuste la couleur de "EKO"). */
  tone?: 'onLight' | 'onDark';
  /** Masquer le texte pour n'afficher que l'icône. */
  showWordmark?: boolean;
  className?: string;
}

/**
 * Logo Ekolova réutilisable : icône + wordmark "EKOLOVA".
 * "EKO" s'adapte au fond (clair/sombre), "LOVA" reste en couleur primaire.
 */
export function Logo({
  iconSize = 40,
  layout = 'horizontal',
  tone = 'onLight',
  showWordmark = true,
  className = '',
}: LogoProps) {
  const fontSize = Math.round(iconSize * 0.6);
  const classes = [
    'brand-logo',
    `brand-logo--${layout}`,
    tone === 'onDark' ? 'brand-logo--on-dark' : 'brand-logo--on-light',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <span className={classes}>
      <BrandIcon size={iconSize} />
      {showWordmark && (
        <span className="brand-logo__wordmark" style={{ fontSize }}>
          <span className="brand-logo__eko">EKO</span>
          <span className="brand-logo__lova">LOVA</span>
        </span>
      )}
    </span>
  );
}
