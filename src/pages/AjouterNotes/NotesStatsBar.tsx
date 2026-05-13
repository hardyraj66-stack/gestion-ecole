interface NotesStatsBarProps {
  filled: number;
  total: number;
  average: number | null;
}

export function NotesStatsBar({ filled, total, average }: NotesStatsBarProps) {
  return (
    <div className="notes-stats-bar">
      <div className="notes-stat">
        <span className="notes-stat-label">Saisies :</span>
        <span className="notes-stat-value">{filled} / {total}</span>
      </div>
      <div className="notes-stat">
        <span className="notes-stat-label">Moy. classe :</span>
        <span className="notes-stat-value">
          {average !== null ? average.toFixed(1) : '—'}
        </span>
      </div>
    </div>
  );
}
