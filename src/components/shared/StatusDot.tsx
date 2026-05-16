interface StatusDotProps {
  color: string;
  size?: number;
}

export function StatusDot({ color, size = 8 }: StatusDotProps) {
  return (
    <span className="status-dot" style={{ width: size, height: size, background: color }} />
  );
}
