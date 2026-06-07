interface BrandIconProps {
  size?: number;
}

/** Logo icône Ekolova — fond adapté à la couleur primaire du thème */
export function BrandIcon({ size = 36 }: BrandIconProps) {
  const r = Math.round((size / 64) * 14);
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" style={{ borderRadius: r, flexShrink: 0 }}>
      <rect width="64" height="64" rx="14" fill="var(--primary)" />
      <polygon points="32,10 50,21 32,29 14,21" fill="white" />
      <rect x="22" y="29" width="20" height="14" rx="3" fill="white" fillOpacity="0.25" />
      <rect x="24" y="31" width="16" height="10" rx="2" fill="white" fillOpacity="0.45" />
      <line x1="50" y1="21" x2="50" y2="33" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="50" cy="36" r="3" fill="white" />
    </svg>
  );
}
