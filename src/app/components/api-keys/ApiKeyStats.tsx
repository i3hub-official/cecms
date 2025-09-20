// src/app/components/api-keys/ApiKeyStats.tsx
"use client"
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
      color: "text-slate-700 dark:text-slate-300",
      bgColor:
        "bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800/50 dark:to-slate-700/50",
      iconBg: "bg-slate-200 dark:bg-slate-700",
      iconColor: "text-slate-600 dark:text-slate-400",
      trend: null,
    },
    {
      title: "Active Keys",
      value: stats.active,
      icon: CheckCircle2,
      color: "text-emerald-700 dark:text-emerald-300",
      bgColor:
        "bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20",
      iconBg: "bg-emerald-200 dark:bg-emerald-800/50",
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
      bgColor:
        "bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20",
      iconBg: "bg-amber-200 dark:bg-amber-800/50",
      iconColor: "text-amber-600 dark:text-amber-400",
      trend: stats.expired > 0 ? "warning" : null,
    },
    {
      title: "Revoked Keys",
      value: stats.revoked,
      icon: XCircle,
      color: "text-red-700 dark:text-red-300",
      bgColor:
        "bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20",
      iconBg: "bg-red-200 dark:bg-red-800/50",
      iconColor: "text-red-600 dark:text-red-400",
      trend: stats.revoked > 0 ? "alert" : null,
    },
  ];

  const getHealthStatus = () => {
    if (activePercentage >= 80)
      return { text: "Excellent", color: "text-emerald-600" };
    if (activePercentage >= 60)
      return { text: "Good", color: "text-green-600" };
    if (activePercentage >= 40)
      return { text: "Fair", color: "text-amber-600" };
    return { text: "Needs Attention", color: "text-red-600" };
  };

  const healthStatus = getHealthStatus();

  return (
    <div className="space-y-6">
      {/* Health Overview */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-xl p-6 border border-blue-200/50 dark:border-blue-800/50">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              API Key Health
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Overall status of your API keys
            </p>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <span className={`text-lg font-bold ${healthStatus.color}`}>
                {healthStatus.text}
              </span>
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {activePercentage.toFixed(0)}% active
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-4">
          <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
            <span>Active Keys</span>
            <span>
              {stats.active} / {stats.total}
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
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
            className={`${stat.bgColor} rounded-xl p-6 border border-gray-200/50 dark:border-gray-700/50 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg group`}
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
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
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
        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/50 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="text-sm font-medium text-amber-800 dark:text-amber-200">
                Maintenance Recommended
              </h4>
              <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
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
