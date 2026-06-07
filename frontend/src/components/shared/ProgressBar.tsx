interface ProgressBarProps {
  value: number;
  max?: number;
  showLabel?: boolean;
  variant?: 'default' | 'danger';
  size?: 'sm' | 'md';
}

export function ProgressBar({ 
  value, 
  max = 100, 
  showLabel = false,
  variant,
  size = 'md',
}: ProgressBarProps) {
  const percentage = Math.min(Math.round((value / max) * 100), 100);
  const isDanger = variant === 'danger' || percentage >= 90;
  
  return (
    <div className="progress-container">
      <div className={`progress ${size === 'sm' ? 'progress-sm' : ''}`}>
        <div 
          className={`progress-bar ${isDanger ? 'full' : ''}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showLabel && (
        <span className="progress-label">{percentage}%</span>
      )}
    </div>
  );
}
