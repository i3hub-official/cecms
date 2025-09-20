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
  if (!pagination || pagination.pages <= 1) return null;

  const { page, limit, total, pages } = pagination;

  const getPageNumbers = () => {
    const delta = 1; // how many pages before/after current
    const range: number[] = [];
    for (
      let i = Math.max(1, page - delta);
      i <= Math.min(pages, page + delta);
      i++
    ) {
      range.push(i);
    }

    // add first + last with ellipsis
    if (range[0] > 1) {
      if (range[0] > 2) range.unshift(-1); // ellipsis
      range.unshift(1);
    }
    if (range[range.length - 1] < pages) {
      if (range[range.length - 1] < pages - 1) range.push(-1); // ellipsis
      range.push(pages);
    }

    return range;
  };

  return (
    <div className="bg-card rounded-lg shadow-sm p-3 sm:p-4 border border-border">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
        {/* Info */}
        <div className="text-xs sm:text-sm text-foreground/70 text-center sm:text-left">
          Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of{" "}
          {total} centers
        </div>

        {/* Pagination controls */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Previous */}
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page === 1}
            aria-label="Previous page"
            className="px-2 py-1 sm:px-3 sm:py-1 text-xs sm:text-sm bg-background border border-border rounded-md disabled:opacity-50 hover:bg-card min-w-[60px] transition-colors disabled:cursor-not-allowed"
          >
            Previous
          </button>

          {/* Page numbers (hidden on very small screens) */}
          <div className="hidden sm:flex items-center gap-1">
            {getPageNumbers().map((num, i) =>
              num === -1 ? (
                <span
                  key={`ellipsis-${i}`}
                  className="px-2 text-foreground/40 text-sm"
                >
                  …
                </span>
              ) : (
                <button
                  key={num}
                  onClick={() => onPageChange(num)}
                  aria-label={`Page ${num}`}
                  className={`px-2 sm:px-3 py-1 rounded-md text-xs sm:text-sm min-w-[36px] transition-colors ${
                    num === page
                      ? "bg-primary text-primary-foreground font-semibold"
                      : "bg-background border border-border hover:bg-card text-foreground"
                  }`}
                >
                  {num}
                </button>
              )
            )}
          </div>

          {/* Next */}
          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page === pages}
            aria-label="Next page"
            className="px-2 py-1 sm:px-3 sm:py-1 text-xs sm:text-sm bg-background border border-border rounded-md disabled:opacity-50 hover:bg-card min-w-[60px] transition-colors disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
