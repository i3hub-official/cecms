// src/app/components/centers/RecentActivityPanel.tsx
import { Building, Clock, MapPin, Plus } from "lucide-react";
import { Center } from "@/types/center";

interface RecentActivityPanelProps {
  centers: Center[];
  onAddCenter?: () => void;
}

export default function RecentActivityPanel({
  centers,
  onAddCenter,
}: RecentActivityPanelProps) {
  const formatShortDate = (date: string) => {
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - new Date(date).getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays}d ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
    return `${Math.floor(diffDays / 30)}mo ago`;
  };

  return (
    <div className="bg-card rounded-xl shadow-sm flex flex-col hover:shadow-md transition-shadow border border-border">
      <div className="px-4 py-3 sm:px-5 border-b border-border flex justify-between items-center">
        <div>
          <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
            <Building className="h-4 w-4 text-primary" />
            Recent Centers
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Latest centers added to the system
          </p>
        </div>
        {onAddCenter && (
          <button
            onClick={onAddCenter}
            className="p-1.5 rounded-md bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
            aria-label="Add new center"
          >
            <Plus className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="flex-1 p-4">
        {centers.length === 0 ? (
          <div className="text-center text-foreground/50 py-8 flex flex-col items-center justify-center h-full">
            <div className="bg-muted/50 rounded-full p-4 mb-4">
              <Building className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium mb-1">No centers yet</p>
            <p className="text-xs text-muted-foreground">
              Add your first center to get started
            </p>
            {onAddCenter && (
              <button
                onClick={onAddCenter}
                className="mt-4 px-3 py-1.5 text-xs bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors flex items-center gap-1"
              >
                <Plus className="h-3 w-3" />
                Add Center
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {centers.slice(0, 5).map((center) => (
              <div
                key={center.id}
                className="group relative p-3 bg-background rounded-lg hover:bg-muted/30 transition-colors border border-border"
              >
                {/* Status indicator */}
                <div
                  className={`absolute top-3 right-3 w-2 h-2 rounded-full ${
                    center.isActive ? "bg-emerald-500" : "bg-red-500"
                  }`}
                />

                {/* Content */}
                <div className="pr-8">
                  {/* Center Name */}
                  <h3 className="text-sm font-medium text-foreground line-clamp-1 mb-1">
                    {center.name}
                  </h3>

                  {/* Center Details */}
                  <div className="flex items-center text-xs text-muted-foreground mb-2">
                    <span className="bg-muted px-1.5 py-0.5 rounded mr-2 font-mono">
                      #{center.number}
                    </span>
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {center.state}
                    </div>
                  </div>

                  {/* Timestamp */}
                  <div className="flex items-center text-xs text-muted-foreground">
                    <Clock className="h-3 w-3 mr-1" />
                    Added {formatShortDate(center.createdAt)}
                  </div>
                </div>

                {/* Hover action buttons */}
                <div className="absolute right-2 bottom-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                  <div className="w-1 h-1 rounded-full bg-muted-foreground/40"></div>
                  <div className="w-1 h-1 rounded-full bg-muted-foreground/40"></div>
                  <div className="w-1 h-1 rounded-full bg-muted-foreground/40"></div>
                </div>
              </div>
            ))}

            {/* View all link if there are more than 5 centers */}
            {centers.length > 5 && (
              <div className="pt-2 border-t border-border/50">
                <button className="text-xs text-primary hover:text-primary/80 transition-colors w-full text-center py-2">
                  View all centers ({centers.length})
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
