// src/app/components/centers/DuplicatesPanel.tsx
import { X, Merge, RefreshCw } from "lucide-react";
import { Duplicate } from "@/types/center";

interface DuplicatesPanelProps {
  duplicates: Duplicate[];
  showDuplicates: boolean;
  onClose: () => void;
  onMerge: (primaryId: string, secondaryIds: string[]) => void;
  isMerging: string | null;
}

export default function DuplicatesPanel({
  duplicates,
  showDuplicates,
  onClose,
  onMerge,
  isMerging,
}: DuplicatesPanelProps) {
  const formatShortDate = (date: string) => {
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - new Date(date).getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  };

  if (!showDuplicates || duplicates.length === 0) return null;

  return (
    <div className="bg-card border border-border rounded-lg p-4 mt-4 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-foreground">
          Review Potential Duplicates ({duplicates.length})
        </h3>
        <button
          onClick={onClose}
          className="text-foreground/50 hover:text-foreground transition-colors p-1"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="space-y-4">
        {duplicates.map((duplicate, index) => {
          if (!duplicate?.centers || duplicate.centers.length < 2) {
            return null;
          }

          const mergeId = `${duplicate.centers[0].id}-${duplicate.centers[1].id}`;
          const isCurrentlyMerging = isMerging === mergeId;

          return (
            <div
              key={`duplicate-${index}-${duplicate.centers[0]?.id}-${duplicate.centers[1]?.id}`}
              className="border border-border rounded-lg p-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
                <span className="text-sm text-foreground/70">
                  {duplicate.similarity || "Unknown"}% similarity (
                  {duplicate.type || "unknown"} match)
                </span>
                <button
                  onClick={() =>
                    onMerge(duplicate.centers[0].id, [duplicate.centers[1].id])
                  }
                  disabled={isCurrentlyMerging}
                  className="bg-emerald-100 hover:bg-emerald-200 text-emerald-700 dark:bg-emerald-900/30 dark:hover:bg-emerald-900/50 dark:text-emerald-400 px-3 py-1 rounded text-sm flex items-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isCurrentlyMerging ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                      Merging...
                    </>
                  ) : (
                    <>
                      <Merge className="h-4 w-4 mr-1" />
                      Merge
                    </>
                  )}
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {duplicate.centers.slice(0, 2).map((center, centerIndex) => (
                  <div
                    key={`center-${center.id}-${index}-${centerIndex}`}
                    className="border border-border rounded-lg p-3 bg-background/30"
                  >
                    <div className="font-medium text-foreground text-sm">
                      {center.name}
                    </div>
                    <div className="text-xs text-foreground/70">
                      #{center.number}
                    </div>
                    <div className="text-xs text-foreground/70 line-clamp-2">
                      {center.address}
                    </div>
                    <div className="text-xs text-foreground/50 mt-2">
                      Created: {formatShortDate(center.createdAt)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}