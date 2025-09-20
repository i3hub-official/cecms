// src/app/components/centers/RecentActivityPanel.tsx
import { Building } from "lucide-react";
import { Center } from "@/types/center";

interface RecentActivityPanelProps {
  centers: Center[];
}

export default function RecentActivityPanel({
  centers,
}: RecentActivityPanelProps) {
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

  return (
    <div className="bg-card rounded-xl shadow-sm flex flex-col hover:shadow-md transition-shadow border border-border">
      {/* Header */}
      <div className="px-4 py-3 sm:px-6 sm:py-4 border-b border-border">
        <h2 className="text-base sm:text-lg font-semibold text-foreground">
          Recent Centers
        </h2>
        <p className="text-xs sm:text-sm text-foreground/70 mt-1">
          Latest centers added to the system
        </p>
      </div>

      {/* Content */}
      <div className="flex-1 p-4 sm:p-6">
        {centers.length === 0 ? (
          // Empty State
          <div className="text-center text-foreground/50 py-8 sm:py-10">
            <Building className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-3 text-primary/80" />
            <p className="text-sm sm:text-base font-medium">No centers yet</p>
            <p className="text-xs sm:text-sm mt-1">
              Add your first center to get started
            </p>
          </div>
        ) : (
          <div className="space-y-2 sm:space-y-3">
            {centers.slice(0, 5).map((center) => (
              <div
                key={center.id}
                className="flex items-start justify-between p-3 sm:p-4 bg-background/30 rounded-lg border border-border/50 hover:bg-background/50 transition-colors"
              >
                <div className="flex-1 pr-3">
                  {/* Name */}
                  <p className="text-sm font-medium text-foreground truncate">
                    {center.name}
                  </p>

                  {/* Number + State */}
                  <p className="text-xs text-muted-foreground mt-0.5">
                    #{center.number} • {center.state}
                  </p>

                  {/* Timestamp */}
                  <p className="text-xs text-foreground/40 mt-1">
                    {formatShortDate(center.createdAt)}
                  </p>
                </div>

                {/* Status Badge */}
                <span
                  className={`shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                    center.isActive
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                      : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                  }`}
                >
                  {center.isActive ? "Active" : "Inactive"}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
