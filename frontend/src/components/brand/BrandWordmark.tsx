interface BrandWordmarkProps {
  height?: number;
}

/** Logo texte "EKOLOVA" — EKO blanc, LOVA en couleur primaire du thème */
export function BrandWordmark({ height = 28 }: BrandWordmarkProps) {
  return (
    <svg
      height={height}
      viewBox="0 0 148 28"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: 'block' }}
    >
      <text
        x="0" y="22"
        fontFamily="Inter, -apple-system, sans-serif"
        fontSize="26"
        fontWeight="800"
        letterSpacing="-0.5"
        fill="white"
      >
        EKO
      </text>
      <text
        x="58" y="22"
        fontFamily="Inter, -apple-system, sans-serif"
        fontSize="26"
        fontWeight="800"
        letterSpacing="-0.5"
        fill="var(--primary)"
      >
        LOVA
      </text>
    </svg>
  );
}
