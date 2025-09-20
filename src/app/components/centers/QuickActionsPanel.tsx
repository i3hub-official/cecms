// src/app/components/centers/QuickActionsPanel.tsx
import { Plus, Merge, Eye, RefreshCw } from "lucide-react";

interface QuickActionsPanelProps {
  onAddCenter: () => void;
  onFindDuplicates: () => void;
  onRefreshData: () => void;
  onTestAPI: () => void;
}

export default function QuickActionsPanel({
  onAddCenter,
  onFindDuplicates,
  onRefreshData,
  onTestAPI,
}: QuickActionsPanelProps) {
  const actions = [
    {
      icon: Plus,
      label: "Add Center",
      description: "Create new center",
      color: "text-emerald-600 dark:text-emerald-400",
      bgColor: "bg-background/50",
      hoverColor: "hover:bg-emerald-50 dark:hover:bg-emerald-900/30",
      action: onAddCenter,
    },
    {
      icon: Merge,
      label: "Find Duplicates",
      description: "Detect similar centers",
      color: "text-amber-600 dark:text-amber-400",
      bgColor: "bg-background/50",
      hoverColor: "hover:bg-amber-50 dark:hover:bg-amber-900/30",
      action: onFindDuplicates,
    },
    {
      icon: Eye,
      label: "Test API",
      description: "Try public lookup",
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-background/50",
      hoverColor: "hover:bg-blue-50 dark:hover:bg-blue-900/30",
      action: onTestAPI,
    },
    {
      icon: RefreshCw,
      label: "Refresh Data",
      description: "Reload all data",
      color: "text-green-600 dark:text-green-400",
      bgColor: "bg-background/50",
      hoverColor: "hover:bg-green-50 dark:hover:bg-green-900/30",
      action: onRefreshData,
    },
  ];

  return (
    <div className="bg-card rounded-xl shadow-sm hover:shadow-md transition-shadow border border-border">
      <div className="px-4 py-3 sm:px-6 sm:py-4 border-b border-border">
        <h2 className="text-base sm:text-lg font-semibold text-foreground">
          Quick Actions
        </h2>
        <p className="text-xs sm:text-sm text-foreground/70 mt-1">
          Common tasks and utilities
        </p>
      </div>
      <div className="p-4 sm:p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          {actions.map((action, index) => {
            const Icon = action.icon;

            return (
              <button
                key={index}
                onClick={action.action}
                className={`flex items-center p-3 sm:p-4 rounded-xl ${action.bgColor} ${action.hoverColor} transition-all hover:shadow-sm border border-transparent hover:border-border`}
              >
                <div className="flex-shrink-0 p-2 bg-card rounded-lg shadow-sm border border-border">
                  <Icon className={`h-4 w-4 sm:h-5 sm:w-5 ${action.color}`} />
                </div>
                <div className="ml-3 text-left">
                  <div className={`text-xs sm:text-sm font-medium ${action.color}`}>
                    {action.label}
                  </div>
                  <div className="text-xs text-foreground/70">
                    {action.description}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}