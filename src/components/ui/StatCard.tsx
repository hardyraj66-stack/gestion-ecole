interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: string;
  color: 'blue' | 'purple' | 'green' | 'orange';
  trend?: number | null;
}

export function StatCard({ title, value, subtitle, icon, color, trend }: StatCardProps) {
  const getTrendIcon = () => {
    if (trend === null || trend === undefined) return null;
    if (trend > 0) return '↑';
    if (trend < 0) return '↓';
    return '→';
  };

  const getTrendClass = () => {
    if (trend === null || trend === undefined) return '';
    if (trend > 0) return 'up';
    if (trend < 0) return 'down';
    return 'neutral';
  };

  return (
    <div className="stat-card">
      <div className="stat-content">
        <div className="stat-title">{title}</div>
        <div className="stat-value">{value}</div>
        {subtitle && <div className="stat-subtitle">{subtitle}</div>}
        {trend !== undefined && trend !== null && (
          <div className={`stat-trend ${getTrendClass()}`}>
            {getTrendIcon()} {Math.abs(trend)}% vs mois dernier
          </div>
        )}
      </div>
      {icon && (
        <div className={`stat-icon ${color}`}>
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d={icon} />
          </svg>
        </div>
      )}
    </div>
  );
}
