// src/app/components/centers/PaginationControls.tsx
interface PaginationControlsProps {
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  onPageChange: (page: number) => void;
}

export default function PaginationControls({
  pagination,
  onPageChange,
}: PaginationControlsProps) {
  if (!pagination || pagination.pages <= 1) {
    return null;
  }

  return (
    <div className="bg-card rounded-lg shadow-sm p-3 sm:p-4 border border-border">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
        <div className="text-xs sm:text-sm text-foreground/70 text-center sm:text-left">
          Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
          {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
          {pagination.total} centers
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => onPageChange(pagination.page - 1)}
            disabled={pagination.page === 1}
            className="px-2 py-1 sm:px-3 sm:py-1 text-xs sm:text-sm bg-background border border-border rounded-md disabled:opacity-50 hover:bg-card min-w-[60px] sm:min-w-[70px] transition-colors disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <span className="px-2 py-1 text-xs sm:text-sm text-foreground/70">
            {pagination.page} / {pagination.pages}
          </span>
          <button
            onClick={() => onPageChange(pagination.page + 1)}
            disabled={pagination.page === pagination.pages}
            className="px-2 py-1 sm:px-3 sm:py-1 text-xs sm:text-sm bg-background border border-border rounded-md disabled:opacity-50 hover:bg-card min-w-[60px] sm:min-w-[70px] transition-colors disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
