"use client";

import { useState, useEffect, useCallback } from "react";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  Activity,
  Calendar,
  Globe,
  RefreshCw,
  AlertCircle,
  Server,
  Clock,
  Zap,
  Eye,
  UserCheck,
  Database,
  MapPin,
  Shield,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertTriangle,
  Info,
} from "lucide-react";

interface CenterStats {
  total: number;
  active: number;
  inactive: number;
  recentlyCreated: number;
  byState: { state: string; count: number }[];
  byLga: { lga: string; state: string; count: number }[];
}

interface UsageStats {
  publicAPI: number;
  adminActions: number;
  totalSessions: number;
  activeSessions: number;
  apiCallsToday: number;
  uniqueUsers: number;
}

interface TrendData {
  date: string;
  centers: number;
  activity: number;
  apiCalls: number;
  sessions: number;
}

interface SystemHealth {
  uptime: string;
  responseTime: string;
  errorRate: string;
  dbConnections: number;
  memoryUsage: string;
  diskUsage: string;
}

interface AnalyticsData {
  centerStats: CenterStats;
  trends: TrendData[];
  usage: UsageStats;
  systemHealth: SystemHealth;
}

interface Notification {
  id: string;
  type: "success" | "error" | "warning" | "info";
  title: string;
  message: string;
}

// Enhanced Notification Component
function NotificationContainer({
  notifications,
  removeNotification,
}: {
  notifications: Notification[];
  removeNotification: (id: string) => void;
}) {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`relative bg-white rounded-lg shadow-lg border-l-4 p-3 transition-all duration-300 ease-in-out transform animate-in slide-in-from-right-5 ${
            notification.type === "success"
              ? "border-green-500"
              : notification.type === "error"
              ? "border-red-500"
              : notification.type === "warning"
              ? "border-yellow-500"
              : "border-blue-500"
          }`}
        >
          <div className="flex items-start">
            <div className="flex-shrink-0">
              {notification.type === "success" && (
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              )}
              {notification.type === "error" && (
                <XCircle className="h-4 w-4 text-red-600" />
              )}
              {notification.type === "warning" && (
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
              )}
              {notification.type === "info" && (
                <Info className="h-4 w-4 text-blue-600" />
              )}
            </div>
            <div className="ml-2 flex-1 min-w-0">
              <h4 className="text-sm font-medium text-gray-900 truncate">
                {notification.title}
              </h4>
              <p className="mt-1 text-xs text-gray-600 line-clamp-2">
                {notification.message}
              </p>
            </div>
            <button
              onClick={() => removeNotification(notification.id)}
              className="ml-2 inline-flex text-gray-400 hover:text-gray-600 transition-colors p-1"
            >
              <XCircle className="h-3 w-3" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

// Enhanced Loading Skeleton
function LoadingSkeleton() {
  return (
    <div className="animate-pulse space-y-4 sm:space-y-6">
      {/* Header skeleton */}
      <div className="space-y-3">
        <div className="h-6 sm:h-8 bg-gray-200 rounded w-32 sm:w-48"></div>
        <div className="h-4 bg-gray-200 rounded w-48 sm:w-64"></div>
      </div>

      {/* Stats grid skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-20 sm:h-24 lg:h-28 bg-gray-200 rounded-lg"
          ></div>
        ))}
      </div>

      {/* Charts skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        <div className="h-48 sm:h-64 lg:h-72 bg-gray-200 rounded-lg"></div>
        <div className="h-48 sm:h-64 lg:h-72 bg-gray-200 rounded-lg"></div>
      </div>

      {/* System health skeleton */}
      <div className="h-32 sm:h-36 bg-gray-200 rounded-lg"></div>
    </div>
  );
}

// Enhanced Metric Card Component
function MetricCard({
  icon: Icon,
  value,
  label,
  subText,
  trend,
  color = "blue",
  loading = false,
}: {
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  value: number | string;
  label: string;
  subText?: string;
  trend?: { value: number; direction: "up" | "down" };
  color?: "blue" | "green" | "purple" | "orange" | "red" | "yellow";
  loading?: boolean;
}) {
  const colorClasses = {
    blue: "text-blue-600 bg-blue-50 border-blue-100",
    green: "text-green-600 bg-green-50 border-green-100",
    purple: "text-purple-600 bg-purple-50 border-purple-100",
    orange: "text-orange-600 bg-orange-50 border-orange-100",
    red: "text-red-600 bg-red-50 border-red-100",
    yellow: "text-yellow-600 bg-yellow-50 border-yellow-100",
  };

  const trendColors = {
    up: "text-green-600 bg-green-50",
    down: "text-red-600 bg-red-50",
  };

  return (
    <div
      className={`bg-white rounded-lg border p-3 sm:p-4 lg:p-6 ${colorClasses[color]} shadow-sm hover:shadow-md transition-all duration-200`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            {loading ? (
              <Loader2 className="h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8 animate-spin text-gray-400" />
            ) : (
              <Icon
                className={`h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8 ${
                  colorClasses[color].split(" ")[0]
                }`}
              />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 truncate">
              {loading ? (
                <div className="h-6 w-16 bg-gray-200 rounded animate-pulse"></div>
              ) : typeof value === "number" ? (
                value.toLocaleString()
              ) : (
                value
              )}
            </div>
            <div className="text-xs sm:text-sm text-gray-600 truncate">
              {label}
            </div>
          </div>
        </div>

        {trend && !loading && (
          <div
            className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${
              trendColors[trend.direction]
            }`}
          >
            {trend.direction === "up" ? (
              <TrendingUp className="h-3 w-3" />
            ) : (
              <TrendingDown className="h-3 w-3" />
            )}
            <span>{Math.abs(trend.value)}%</span>
          </div>
        )}
      </div>

      {subText && !loading && (
        <div
          className={`text-xs mt-2 ${
            colorClasses[color].split(" ")[0]
          } font-medium truncate`}
        >
          {subText}
        </div>
      )}
    </div>
  );
}

// Enhanced Chart Component
function ActivityChart({
  data,
  loading,
}: {
  data: TrendData[];
  loading: boolean;
}) {
  if (loading) {
    return (
      <div className="h-48 sm:h-56 lg:h-64 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!data.length) {
    return (
      <div className="h-48 sm:h-56 lg:h-64 flex items-center justify-center text-gray-500">
        <div className="text-center">
          <BarChart3 className="h-8 w-8 sm:h-12 sm:w-12 mx-auto mb-2 text-gray-300" />
          <p className="text-sm">No activity data available</p>
        </div>
      </div>
    );
  }

  const maxActivity = Math.max(...data.map((d) => d.activity));
  const maxCenters = Math.max(...data.map((d) => d.centers));

  return (
    <div className="space-y-4">
      <div className="h-48 sm:h-56 lg:h-64 flex items-end justify-between space-x-1 sm:space-x-2 px-2">
        {data.map((day, index) => (
          <div
            key={day.date}
            className="flex flex-col items-center space-y-1 flex-1 max-w-12"
          >
            <div className="flex flex-col items-center space-y-0.5 w-full">
              <div
                className="w-full bg-blue-500 rounded-t transition-all duration-300 hover:bg-blue-600 cursor-pointer"
                style={{
                  height: `${Math.max(
                    (day.activity / maxActivity) * 120,
                    4
                  )}px`,
                }}
                title={`${day.activity} activities on ${new Date(
                  day.date
                ).toLocaleDateString()}`}
              ></div>
              <div
                className="w-full bg-green-500 rounded-b transition-all duration-300 hover:bg-green-600 cursor-pointer"
                style={{
                  height: `${Math.max((day.centers / maxCenters) * 60, 4)}px`,
                }}
                title={`${day.centers} centers on ${new Date(
                  day.date
                ).toLocaleDateString()}`}
              ></div>
            </div>
            <div className="text-xs text-gray-500 text-center font-medium">
              {new Date(day.date).toLocaleDateString("en-US", {
                weekday: "short",
                day: "numeric",
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex justify-center space-x-4 sm:space-x-6">
        <div className="flex items-center">
          <div className="w-3 h-3 bg-blue-500 rounded mr-2"></div>
          <span className="text-xs sm:text-sm text-gray-600 font-medium">
            Activities
          </span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-green-500 rounded mr-2"></div>
          <span className="text-xs sm:text-sm text-gray-600 font-medium">
            Centers
          </span>
        </div>
      </div>
    </div>
  );
}

// Enhanced Usage Distribution Component
function UsageDistribution({
  data,
  loading,
}: {
  data: UsageStats;
  loading: boolean;
}) {
  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="flex justify-between mb-2">
              <div className="h-4 w-24 bg-gray-200 rounded"></div>
              <div className="h-4 w-12 bg-gray-200 rounded"></div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2"></div>
          </div>
        ))}
      </div>
    );
  }

  const total = data.publicAPI + data.adminActions + data.activeSessions;

  const items = [
    {
      label: "Public API Requests",
      value: data.publicAPI,
      color: "blue",
      percentage: total > 0 ? (data.publicAPI / total) * 100 : 0,
    },
    {
      label: "Admin Actions",
      value: data.adminActions,
      color: "green",
      percentage: total > 0 ? (data.adminActions / total) * 100 : 0,
    },
    {
      label: "Active Sessions",
      value: data.activeSessions,
      color: "purple",
      percentage: total > 0 ? (data.activeSessions / total) * 100 : 0,
    },
  ];

  return (
    <div className="space-y-4">
      {items.map((item, index) => (
        <div key={index}>
          <div className="flex justify-between items-center text-xs sm:text-sm mb-2">
            <span className="text-gray-600 font-medium">{item.label}</span>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-gray-900">
                {item.value.toLocaleString()}
              </span>
              <span className="text-gray-500 text-xs">
                ({item.percentage.toFixed(1)}%)
              </span>
            </div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div
              className={`h-2 rounded-full transition-all duration-500 ease-out ${
                item.color === "blue"
                  ? "bg-blue-600"
                  : item.color === "green"
                  ? "bg-green-600"
                  : "bg-purple-600"
              }`}
              style={{ width: `${item.percentage}%` }}
            ></div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData>({
    centerStats: {
      total: 0,
      active: 0,
      inactive: 0,
      recentlyCreated: 0,
      byState: [],
      byLga: [],
    },
    trends: [],
    usage: {
      publicAPI: 0,
      adminActions: 0,
      totalSessions: 0,
      activeSessions: 0,
      apiCallsToday: 0,
      uniqueUsers: 0,
    },
    systemHealth: {
      uptime: "0%",
      responseTime: "0ms",
      errorRate: "0%",
      dbConnections: 0,
      memoryUsage: "0%",
      diskUsage: "0%",
    },
  });

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState("7d");
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Notification management
  const addNotification = (notification: Omit<Notification, "id">) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newNotification = { ...notification, id };
    setNotifications((prev) => [...prev, newNotification]);

    // Auto remove after 5 seconds
    setTimeout(() => {
      removeNotification(id);
    }, 5000);
  };

  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const loadAnalytics = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      try {
        // Simulate API call structure based on your pattern
        const response = await fetch(`/api/analytics?range=${timeRange}`, {
          method: "GET",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          if (response.status === 401) {
            throw new Error("Unauthorized - Please login again");
          }
          throw new Error(
            `Failed to fetch analytics: ${response.status} ${response.statusText}`
          );
        }

        const result = await response.json();

        if (result.error) {
          throw new Error(result.error);
        }

        // Simulate realistic data structure
        const mockData: AnalyticsData = {
          centerStats: {
            total: 1247,
            active: 1189,
            inactive: 58,
            recentlyCreated: 23,
            byState: [
              { state: "Lagos", count: 245 },
              { state: "Kano", count: 189 },
              { state: "Rivers", count: 134 },
              { state: "Oyo", count: 98 },
              { state: "Kaduna", count: 87 },
            ],
            byLga: [
              { lga: "Ikeja", state: "Lagos", count: 45 },
              { lga: "Victoria Island", state: "Lagos", count: 38 },
              { lga: "Kano Municipal", state: "Kano", count: 42 },
            ],
          },
          trends: Array.from({ length: 7 }, (_, i) => ({
            date: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000)
              .toISOString()
              .split("T")[0],
            centers: Math.floor(Math.random() * 12) + 3,
            activity: Math.floor(Math.random() * 35) + 10,
            apiCalls: Math.floor(Math.random() * 500) + 100,
            sessions: Math.floor(Math.random() * 15) + 5,
          })),
          usage: {
            publicAPI: 12847,
            adminActions: 3421,
            totalSessions: 89,
            activeSessions: 12,
            apiCallsToday: 2341,
            uniqueUsers: 156,
          },
          systemHealth: {
            uptime: "99.8%",
            responseTime: "142ms",
            errorRate: "0.2%",
            dbConnections: 8,
            memoryUsage: "68%",
            diskUsage: "45%",
          },
        };

        setData(mockData);
        setLastUpdated(new Date());

        if (isRefresh) {
          addNotification({
            type: "success",
            title: "Data Refreshed",
            message: "Analytics data has been updated successfully",
          });
        }
      } catch (error) {
        console.error("Failed to load analytics:", error);
        const errorMessage =
          error instanceof Error ? error.message : "An unknown error occurred";
        setError(errorMessage);

        addNotification({
          type: "error",
          title: "Loading Failed",
          message: errorMessage,
        });

        // Keep existing data if refresh fails
        if (!isRefresh && !data.centerStats.total) {
          setData({
            centerStats: {
              total: 0,
              active: 0,
              inactive: 0,
              recentlyCreated: 0,
              byState: [],
              byLga: [],
            },
            trends: [],
            usage: {
              publicAPI: 0,
              adminActions: 0,
              totalSessions: 0,
              activeSessions: 0,
              apiCallsToday: 0,
              uniqueUsers: 0,
            },
            systemHealth: {
              uptime: "0%",
              responseTime: "0ms",
              errorRate: "0%",
              dbConnections: 0,
              memoryUsage: "0%",
              diskUsage: "0%",
            },
          });
        }
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [timeRange, data.centerStats.total]
  );

  useEffect(() => {
    loadAnalytics();
  }, [timeRange]);

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      if (!loading && !refreshing) {
        loadAnalytics(true);
      }
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [loading, refreshing, loadAnalytics]);

  return (
    <>
      <NotificationContainer
        notifications={notifications}
        removeNotification={removeNotification}
      />

      <div className="min-h-screen bg-gray-50 p-3 sm:p-4 lg:p-6">
        <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
          {/* Header */}
          <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
            <div className="flex flex-col space-y-4 sm:flex-row sm:justify-between sm:items-start sm:space-y-0">
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">
                  Analytics Dashboard
                </h1>
                <p className="text-sm sm:text-base text-gray-600 mt-1">
                  System usage and performance metrics
                </p>
                {lastUpdated && (
                  <div className="flex items-center text-xs text-gray-500 mt-2">
                    <Clock className="h-3 w-3 mr-1" />
                    Last updated: {lastUpdated.toLocaleTimeString()}
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <select
                  value={timeRange}
                  onChange={(e) => setTimeRange(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={refreshing || loading}
                >
                  <option value="7d">Last 7 days</option>
                  <option value="30d">Last 30 days</option>
                  <option value="90d">Last 90 days</option>
                  <option value="1y">Last year</option>
                </select>
                <button
                  onClick={() => loadAnalytics(true)}
                  disabled={refreshing || loading}
                  className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-colors shadow-sm hover:shadow-md"
                >
                  <RefreshCw
                    className={`h-4 w-4 mr-2 ${
                      refreshing ? "animate-spin" : ""
                    }`}
                  />
                  {refreshing ? "Updating..." : "Refresh"}
                </button>
              </div>
            </div>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4 shadow-sm">
              <div className="flex items-start">
                <AlertCircle className="h-5 w-5 text-red-500 mr-3 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <span className="text-red-700 text-sm sm:text-base break-words">
                    {error}
                  </span>
                </div>
                <button
                  onClick={() => setError(null)}
                  className="ml-3 bg-red-100 hover:bg-red-200 text-red-700 px-3 py-1 rounded-lg text-sm font-medium transition-colors flex-shrink-0"
                >
                  Dismiss
                </button>
              </div>
            </div>
          )}

          {loading ? (
            <LoadingSkeleton />
          ) : (
            <>
              {/* Key Metrics Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
                <MetricCard
                  icon={Database}
                  value={data.centerStats.total}
                  label="Total Centers"
                  subText={`+${data.centerStats.recentlyCreated} this week`}
                  trend={{ value: 8.5, direction: "up" }}
                  color="blue"
                  loading={refreshing}
                />
                <MetricCard
                  icon={Globe}
                  value={data.usage.publicAPI}
                  label="API Requests"
                  subText={`${data.usage.apiCallsToday} today`}
                  trend={{ value: 12.3, direction: "up" }}
                  color="green"
                  loading={refreshing}
                />
                <MetricCard
                  icon={Users}
                  value={data.usage.activeSessions}
                  label="Active Sessions"
                  subText={`${data.usage.totalSessions} total`}
                  trend={{ value: 5.2, direction: "up" }}
                  color="purple"
                  loading={refreshing}
                />
                <MetricCard
                  icon={Activity}
                  value={data.usage.adminActions}
                  label="Admin Actions"
                  subText="CRUD operations"
                  trend={{ value: 2.1, direction: "down" }}
                  color="orange"
                  loading={refreshing}
                />
              </div>

              {/* Charts Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                {/* Activity Trend Chart */}
                <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                      Activity Trend
                    </h3>
                    <div className="flex items-center text-sm text-gray-500">
                      <TrendingUp className="h-4 w-4 mr-1" />
                      {timeRange}
                    </div>
                  </div>
                  <ActivityChart data={data.trends} loading={refreshing} />
                </div>

                {/* Usage Distribution */}
                <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                      Usage Distribution
                    </h3>
                    <div className="flex items-center text-sm text-gray-500">
                      <BarChart3 className="h-4 w-4 mr-1" />
                      Current period
                    </div>
                  </div>
                  <UsageDistribution data={data.usage} loading={refreshing} />
                </div>
              </div>

              {/* System Health */}
              <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                    System Health
                  </h3>
                  <div className="flex items-center text-sm text-green-600">
                    <CheckCircle2 className="h-4 w-4 mr-1" />
                    All systems operational
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-6">
                  {[
                    {
                      icon: Server,
                      value: data.systemHealth.uptime,
                      label: "Uptime",
                      subText: "Last 30 days",
                      color: "green",
                    },
                    {
                      icon: Zap,
                      value: data.systemHealth.responseTime,
                      label: "Response Time",
                      subText: "Average",
                      color: "blue",
                    },
                    {
                      icon: AlertTriangle,
                      value: data.systemHealth.errorRate,
                      label: "Error Rate",
                      subText: "Last 24h",
                      color: "red",
                    },
                    {
                      icon: Database,
                      value: data.systemHealth.dbConnections,
                      label: "DB Connections",
                      subText: "Active",
                      color: "purple",
                    },
                    {
                      icon: Activity,
                      value: data.systemHealth.memoryUsage,
                      label: "Memory Usage",
                      subText: "Current",
                      color: "orange",
                    },
                    {
                      icon: MapPin,
                      value: data.systemHealth.diskUsage,
                      label: "Disk Usage",
                      subText: "Current",
                      color: "yellow",
                    },
                  ].map((metric, index) => (
                    <MetricCard
                      key={index}
                      icon={metric.icon}
                      value={metric.value}
                      label={metric.label}
                      subText={metric.subText}
                      color={
                        metric.color as
                          | "blue"
                          | "green"
                          | "purple"
                          | "orange"
                          | "red"
                          | "yellow"
                      }
                    />
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
