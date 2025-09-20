// src/app/components/centers/StatsGrid.tsx
import {
  Building,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
} from "lucide-react";
import { Stats } from "@/types/center";

interface StatsGridProps {
  stats: Stats;
  duplicatesCount: number;
}

export default function StatsGrid({ stats, duplicatesCount }: StatsGridProps) {
  const statItems = [
    {
      icon: Building,
      value: stats.total,
      label: "Total Centers",
      color: "text-blue-600 dark:text-blue-400",
    },
    {
      icon: CheckCircle,
      value: stats.active,
      label: "Active Centers",
      color: "text-emerald-600 dark:text-emerald-400",
    },
    {
      icon: AlertCircle,
      value: stats.inactive,
      label: "Inactive Centers",
      color: "text-red-600 dark:text-red-400",
    },
    {
      icon: AlertTriangle,
      value: duplicatesCount,
      label: "Duplicates Found",
      color: "text-amber-600 dark:text-amber-400",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
      {statItems.map((stat, index) => {
        const Icon = stat.icon;

        return (
          <div
            key={index}
            className="bg-card rounded-lg shadow-sm p-3 sm:p-4 lg:p-6 hover:shadow-md transition-shadow border border-border"
          >
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Icon
                  className={`h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8 ${stat.color}`}
                />
              </div>
              <div className="ml-2 sm:ml-3 lg:ml-4 min-w-0">
                <div className="text-base sm:text-lg lg:text-2xl font-bold text-foreground">
                  {stat.value || 0}
                </div>
                <div className="text-xs sm:text-sm text-foreground/70 truncate">
                  {stat.label}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
