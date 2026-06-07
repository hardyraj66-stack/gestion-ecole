interface MiniPaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function MiniPagination({ page, totalPages, onPageChange }: MiniPaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="mini-pagination">
      <button disabled={page <= 1} onClick={() => onPageChange(page - 1)} className="btn btn-sm btn-secondary">←</button>
      <span className="mini-pagination-label">{page} / {totalPages}</span>
      <button disabled={page >= totalPages} onClick={() => onPageChange(page + 1)} className="btn btn-sm btn-secondary">→</button>
    </div>
  );
}
