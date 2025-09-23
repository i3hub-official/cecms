// src/app/components/api-keys/ApiKeyStats.tsx
"use client";
import { ApiKey } from "@/types/api-keys";
import { Key, CheckCircle2, Clock, XCircle, TrendingUp } from "lucide-react";

interface ApiKeyStatsProps {
  apiKeys: ApiKey[];
}

export default function ApiKeyStats({ apiKeys }: ApiKeyStatsProps) {
  const isExpired = (dateString: string) => {
    try {
      return new Date(dateString) < new Date();
    } catch {
      return false;
    }
  };

  const stats = {
    total: apiKeys.length,
    active: apiKeys.filter(
      (key) => !key.revokedAt && key.isActive && !isExpired(key.expiresAt)
    ).length,
    expired: apiKeys.filter((key) => isExpired(key.expiresAt) && !key.revokedAt)
      .length,
    revoked: apiKeys.filter((key) => key.revokedAt).length,
  };

  const activePercentage =
    stats.total > 0 ? (stats.active / stats.total) * 100 : 0;

  const statCards = [
    {
      title: "Total Keys",
      value: stats.total,
      icon: Key,
      color: "text-foreground",
      bgColor: "bg-card",
      iconBg: "bg-card",
      iconColor: "text-foreground/70",
      trend: null,
    },
    {
      title: "Active Keys",
      value: stats.active,
      icon: CheckCircle2,
      color: "text-emerald-700 dark:text-emerald-300",
      bgColor: "bg-card",
      iconBg: "bg-card dark:bg-emerald-900/50",
      iconColor: "text-emerald-600 dark:text-emerald-400",
      trend:
        activePercentage >= 75
          ? "high"
          : activePercentage >= 50
          ? "medium"
          : "low",
    },
    {
      title: "Expired Keys",
      value: stats.expired,
      icon: Clock,
      color: "text-amber-700 dark:text-amber-300",
      bgColor: "bg-card",
      iconBg: "bg-card dark:bg-amber-900/50",
      iconColor: "text-amber-600 dark:text-amber-400",
      trend: stats.expired > 0 ? "warning" : null,
    },
    {
      title: "Revoked Keys",
      value: stats.revoked,
      icon: XCircle,
      color: "text-red-700 dark:text-red-300",
      bgColor: "bg-card",
      iconBg: "bg-card dark:bg-red-900/50",
      iconColor: "text-red-600 dark:text-red-400",
      trend: stats.revoked > 0 ? "alert" : null,
    },
  ];

  const getHealthStatus = () => {
    if (activePercentage >= 80)
      return {
        text: "Excellent",
        color: "text-emerald-600 dark:text-emerald-400",
      };
    if (activePercentage >= 60)
      return { text: "Good", color: "text-green-600 dark:text-green-400" };
    if (activePercentage >= 40)
      return { text: "Fair", color: "text-amber-600 dark:text-amber-400" };
    return { text: "Needs Attention", color: "text-red-600 dark:text-red-400" };
  };

  const healthStatus = getHealthStatus();

  return (
    <div className="space-y-6">
      {/* Health Overview */}
      <div className="bg-card rounded-xl p-6 border border-border shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-foreground">
              API Key Health
            </h3>
            <p className="text-sm text-foreground/70 mt-1">
              Overall status of your API keys
            </p>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <span className={`text-lg font-bold ${healthStatus.color}`}>
                {healthStatus.text}
              </span>
            </div>
            <div className="text-sm text-foreground/70">
              {activePercentage.toFixed(0)}% active
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-4">
          <div className="flex justify-between text-xs text-foreground/70 mb-1">
            <span>Active Keys</span>
            <span>
              {stats.active} / {stats.total}
            </span>
          </div>
          <div className="w-full bg-background rounded-full h-2 border border-border">
            <div
              className="bg-gradient-to-r from-emerald-500 to-green-500 h-2 rounded-full transition-all duration-700 ease-out"
              style={{ width: `${activePercentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => (
          <div
            key={index}
            className={`${stat.bgColor} rounded-xl p-6 border border-border shadow-sm transition-all duration-300 hover:scale-[1.02] hover:shadow-lg group`}
          >
            <div className="flex items-center justify-between mb-4">
              <div
                className={`${stat.iconBg} p-2 rounded-lg group-hover:scale-110 transition-transform duration-300`}
              >
                <stat.icon className={`h-5 w-5 ${stat.iconColor}`} />
              </div>
              {stat.trend && (
                <div className="flex items-center gap-1">
                  {stat.trend === "high" && (
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                  )}
                  {stat.trend === "warning" && (
                    <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
                  )}
                  {stat.trend === "alert" && (
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                  )}
                </div>
              )}
            </div>

            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground/70">
                {stat.title}
              </p>
              <p className={`text-3xl font-bold ${stat.color} tabular-nums`}>
                {stat.value}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions Hint */}
      {(stats.expired > 0 || stats.revoked > 0) && (
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="text-sm font-medium text-foreground">
                Maintenance Recommended
              </h4>
              <p className="text-sm text-foreground/70 mt-1">
                {stats.expired > 0 &&
                  `${stats.expired} key${
                    stats.expired === 1 ? "" : "s"
                  } expired. `}
                {stats.revoked > 0 &&
                  `${stats.revoked} key${
                    stats.revoked === 1 ? "" : "s"
                  } revoked. `}
                Consider cleaning up unused keys or renewing expired ones.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
