"use client";

import { useState, useEffect } from "react";
import {
  BarChart3,
  TrendingUp,
  Users,
  Activity,
  Calendar,
  Globe,
  RefreshCw,
  AlertCircle,
} from "lucide-react";

interface AnalyticsData {
  centerStats: {
    total: number;
    active: number;
    inactive: number;
    recentlyCreated: number;
  };
  trends: {
    date: string;
    centers: number;
    activity: number;
  }[];
  usage: {
    publicAPI: number;
    adminActions: number;
    totalSessions: number;
  };
  systemHealth: {
    uptime: string;
    responseTime: string;
    errorRate: string;
  };
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData>({
    centerStats: { total: 0, active: 0, inactive: 0, recentlyCreated: 0 },
    trends: [],
    usage: { publicAPI: 0, adminActions: 0, totalSessions: 0 },
    systemHealth: { uptime: "0%", responseTime: "0ms", errorRate: "0%" },
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState("7d");

  useEffect(() => {
    loadAnalytics();
  }, [timeRange]);

  const loadAnalytics = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const response = await fetch(`/api/analytics?range=${timeRange}`, {
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch analytics: ${response.status}`);
      }

      const analyticsData = await response.json();

      if (analyticsData.success) {
        setData(analyticsData.data);
      } else {
        throw new Error(analyticsData.error || "Failed to load analytics data");
      }
    } catch (error) {
      console.error("Failed to load analytics:", error);
      setError(
        error instanceof Error ? error.message : "An unknown error occurred"
      );

      // Fallback to minimal data if API fails
      if (!isRefresh) {
        setData({
          centerStats: { total: 0, active: 0, inactive: 0, recentlyCreated: 0 },
          trends: [],
          usage: { publicAPI: 0, adminActions: 0, totalSessions: 0 },
          systemHealth: { uptime: "0%", responseTime: "0ms", errorRate: "0%" },
        });
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat().format(num);
  };

  const calculateTrendPercentage = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? "+100%" : "0%";
    const change = ((current - previous) / previous) * 100;
    return `${change >= 0 ? "+" : ""}${change.toFixed(1)}%`;
  };

  if (loading) {
    return (
      <div className="p-4 md:p-6">
        <div className="animate-pulse space-y-4 md:space-y-6">
          <div className="h-8 bg-gray-200 rounded w-48 md:w-64"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-28 md:h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-64 md:h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">
            Analytics
          </h1>
          <p className="text-sm md:text-base text-gray-600">
            System usage and performance metrics
          </p>
        </div>
        <div className="flex gap-2">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="input text-sm md:text-base w-auto"
            disabled={refreshing}
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
          <button
            onClick={() => loadAnalytics(true)}
            disabled={refreshing}
            className="inline-flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm md:text-base"
          >
            <RefreshCw
              className={`h-4 w-4 mr-1 md:mr-2 ${
                refreshing ? "animate-spin" : ""
              }`}
            />
            Refresh
          </button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 md:p-4">
          <div className="flex items-center">
            <AlertCircle className="h-4 w-4 md:h-5 md:w-5 text-red-500 mr-2" />
            <span className="text-red-700 text-sm md:text-base">{error}</span>
          </div>
        </div>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {[
          {
            icon: BarChart3,
            value: data.centerStats.total,
            label: "Total Centers",
            subText: `+${data.centerStats.recentlyCreated} this week`,
            color: "blue",
          },
          {
            icon: Globe,
            value: data.usage.publicAPI,
            label: "API Requests",
            subText: "+12% from last week",
            color: "green",
          },
          {
            icon: Users,
            value: data.usage.totalSessions,
            label: "Admin Sessions",
            subText: "Currently active",
            color: "purple",
          },
          {
            icon: Activity,
            value: data.usage.adminActions,
            label: "Admin Actions",
            subText: "CRUD operations",
            color: "orange",
          },
        ].map((metric, index) => {
          const Icon = metric.icon;
          return (
            <div key={index} className="card p-4 md:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Icon
                    className={`h-6 w-6 md:h-8 md:w-8 text-${metric.color}-600`}
                  />
                </div>
                <div className="ml-3 md:ml-4">
                  <div className="text-xl md:text-2xl font-bold text-gray-900">
                    {formatNumber(metric.value)}
                  </div>
                  <div className="text-sm text-gray-600">{metric.label}</div>
                  <div className={`text-xs text-${metric.color}-600 mt-1`}>
                    {metric.subText}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Activity Trend */}
        <div className="card p-4 md:p-6">
          <h3 className="text-base md:text-lg font-medium text-gray-900 mb-3 md:mb-4">
            Activity Trend
          </h3>
          {data.trends.length === 0 ? (
            <div className="h-48 md:h-64 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <BarChart3 className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">No activity data available</p>
              </div>
            </div>
          ) : (
            <>
              <div className="h-48 md:h-64 flex items-end justify-between space-x-1 md:space-x-2">
                {data.trends.map((day, index) => (
                  <div
                    key={day.date}
                    className="flex flex-col items-center space-y-1 md:space-y-2 flex-1"
                  >
                    <div className="flex flex-col items-center space-y-1 w-full">
                      <div
                        className="w-full max-w-8 bg-blue-500 rounded-t"
                        style={{
                          height: `${Math.max((day.activity / 35) * 100, 5)}px`,
                        }}
                        title={`${day.activity} activities`}
                      ></div>
                      <div
                        className="w-full max-w-8 bg-green-500 rounded-b"
                        style={{
                          height: `${Math.max((day.centers / 12) * 50, 5)}px`,
                        }}
                        title={`${day.centers} centers`}
                      ></div>
                    </div>
                    <div className="text-xs text-gray-500 text-center">
                      {new Date(day.date).toLocaleDateString("en-US", {
                        weekday: "short",
                      })}
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-center space-x-4 md:space-x-6 mt-3 md:mt-4">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-blue-500 rounded mr-2"></div>
                  <span className="text-xs md:text-sm text-gray-600">
                    Activities
                  </span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-500 rounded mr-2"></div>
                  <span className="text-xs md:text-sm text-gray-600">
                    Centers
                  </span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Usage Distribution */}
        <div className="card p-4 md:p-6">
          <h3 className="text-base md:text-lg font-medium text-gray-900 mb-3 md:mb-4">
            Usage Distribution
          </h3>
          <div className="space-y-3 md:space-y-4">
            {[
              {
                label: "Public API Requests",
                value: data.usage.publicAPI,
                color: "blue",
                width: "68%",
              },
              {
                label: "Admin Actions",
                value: data.usage.adminActions,
                color: "green",
                width: "32%",
              },
              {
                label: "Active Sessions",
                value: data.usage.totalSessions,
                color: "purple",
                width: "15%",
              },
            ].map((item, index) => (
              <div key={index}>
                <div className="flex justify-between text-xs md:text-sm mb-1">
                  <span className="text-gray-600">{item.label}</span>
                  <span className="font-medium">
                    {formatNumber(item.value)}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`bg-${item.color}-600 h-2 rounded-full`}
                    style={{ width: item.width }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* System Health */}
      <div className="card p-4 md:p-6">
        <h3 className="text-base md:text-lg font-medium text-gray-900 mb-3 md:mb-4">
          System Health
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
          {[
            {
              value: data.systemHealth.uptime,
              label: "Uptime",
              subText: "Last 30 days",
              color: "green",
            },
            {
              value: data.systemHealth.responseTime,
              label: "Avg Response Time",
              subText: "API endpoints",
              color: "blue",
            },
            {
              value: data.systemHealth.errorRate,
              label: "Error Rate",
              subText: "Last 7 days",
              color: "purple",
            },
          ].map((stat, index) => (
            <div key={index} className="text-center">
              <div
                className={`text-2xl md:text-3xl font-bold text-${stat.color}-600 mb-1 md:mb-2`}
              >
                {stat.value}
              </div>
              <div className="text-sm text-gray-600">{stat.label}</div>
              <div className="text-xs text-gray-500 mt-1">{stat.subText}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Data Status */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 md:p-4">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            {refreshing ? (
              <RefreshCw className="h-4 w-4 md:h-5 md:w-5 text-blue-600 animate-spin" />
            ) : (
              <BarChart3 className="h-4 w-4 md:h-5 md:w-5 text-blue-600" />
            )}
          </div>
          <div className="ml-3">
            <div className="text-sm md:text-base font-medium text-blue-900">
              {refreshing ? "Updating analytics..." : "Analytics Data Status"}
            </div>
            <div className="text-xs md:text-sm text-blue-700">
              {refreshing
                ? "Fetching latest data"
                : `Data updated in real-time • ${timeRange} view`}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
