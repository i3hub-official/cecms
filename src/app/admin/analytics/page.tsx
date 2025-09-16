"use client";

import { useState, useEffect, useCallback, useRef } from "react";
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
          className={`relative bg-card rounded-lg shadow-lg border-l-4 p-3 transition-all duration-300 ease-in-out transform animate-in slide-in-from-right-5 ${
            notification.type === "success"
              ? "border-success"
              : notification.type === "error"
              ? "border-danger"
              : notification.type === "warning"
              ? "border-warning"
              : "border-info"
          }`}
        >
          <div className="flex items-start">
            <div className="flex-shrink-0">
              {notification.type === "success" && (
                <CheckCircle2 className="h-4 w-4 text-success" />
              )}
              {notification.type === "error" && (
                <XCircle className="h-4 w-4 text-danger" />
              )}
              {notification.type === "warning" && (
                <AlertTriangle className="h-4 w-4 text-info" />
              )}
              {notification.type === "info" && (
                <Info className="h-4 w-4 text-info" />
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
        <div className="h-6 sm:h-8 bg-card rounded w-32 sm:w-48"></div>
        <div className="h-4 bg-card rounded w-48 sm:w-64"></div>
      </div>

      {/* Stats grid skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-20 sm:h-24 lg:h-28 bg-card rounded-lg"
          ></div>
        ))}
      </div>

      {/* Charts skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        <div className="h-48 sm:h-64 lg:h-72 bg-card rounded-lg"></div>
        <div className="h-48 sm:h-64 lg:h-72 bg-card rounded-lg"></div>
      </div>

      {/* System health skeleton */}
      <div className="h-32 sm:h-36 bg-card rounded-lg"></div>
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
  color,
  loading,
  className = "",
}) {
  return (
    <div
      className={`rounded-xl p-4 transition-all hover:shadow-md ${className}`}
    >
      <div className="flex justify-between items-start mb-3">
        <Icon
          className={`h-5 w-5 ${
            color === "blue"
              ? "text-blue-500"
              : color === "green"
              ? "text-green-500"
              : color === "purple"
              ? "text-purple-500"
              : color === "orange"
              ? "text-orange-500"
              : "text-gray-500"
          }`}
        />

        {/* Trend indicator - keeping same size and location */}
        {trend && (
          <div
            className={`flex items-center text-xs ${
              trend.direction === "up"
                ? "text-green-500"
                : "text-primary-foreground"
            }`}
          >
            {trend.direction === "up" ? (
              <TrendingUp className="h-3 w-3 mr-1" />
            ) : (
              <TrendingDown className="h-3 w-3 mr-1" />
            )}
            {trend.value}%
          </div>
        )}
      </div>

      <div className="mb-2">
        <div className="text-2xl font-bold text-card-foreground">
          {loading ? (
            <div className="h-7 w-12 bg-muted rounded animate-pulse"></div>
          ) : (
            value
          )}
        </div>
        <div className="text-sm text-muted-foreground">{label}</div>
      </div>

      <div className="text-xs text-muted-foreground/80">{subText}</div>
    </div>
  );
}

// Enhanced Chart Component
function ActivityChart({
  data,
  loading,
  timeRange = "7d"
}: {
  data: TrendData[];
  loading: boolean;
  timeRange?: string;
}) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  useEffect(() => {
    const updateContainerSize = () => {
      if (chartContainerRef.current) {
        setContainerWidth(chartContainerRef.current.offsetWidth);
      }
    };

    updateContainerSize();
    window.addEventListener('resize', updateContainerSize);
    
    return () => window.removeEventListener('resize', updateContainerSize);
  }, []);

  if (loading) {
    return (
      <div className="h-48 sm:h-56 lg:h-64 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!data.length) {
    return (
      <div className="h-48 sm:h-56 lg:h-64 flex items-center justify-center text-muted-foreground">
        <div className="text-center">
          <BarChart3 className="h-8 w-8 sm:h-12 sm:w-12 mx-auto mb-2 text-muted-foreground/50" />
          <p className="text-sm">No activity data available</p>
        </div>
      </div>
    );
  }

  const maxActivity = Math.max(...data.map((d) => d.activity));
  const maxCenters = Math.max(...data.map((d) => d.centers));

  // Calculate bar width based on container width and number of data points
  const calculateBarDimensions = () => {
    const minBarWidth = 8;
    const maxBarWidth = 20;
    const spacing = 4;
    
    const availableWidth = containerWidth - (data.length * spacing);
    const barWidth = Math.max(minBarWidth, Math.min(maxBarWidth, availableWidth / data.length));
    
    return {
      barWidth,
      spacing,
      totalWidth: data.length * (barWidth + spacing)
    };
  };

  const { barWidth, spacing, totalWidth } = calculateBarDimensions();

  return (
    <div className="space-y-4" ref={chartContainerRef}>
      <div 
        className="h-48 sm:h-56 lg:h-64 flex items-end justify-start space-x-1 sm:space-x-2 px-2 overflow-x-auto"
        style={{ minWidth: `${totalWidth}px` }}
      >
        {data.map((day, index) => (
          <div
            key={day.date}
            className="flex flex-col items-center space-y-1"
            style={{ width: `${barWidth}px`, minWidth: `${barWidth}px` }}
          >
            <div className="flex flex-col items-center space-y-0.5 w-full">
              <div
                className="w-full bg-primary rounded-t transition-all duration-300 hover:bg-primary/80 cursor-pointer"
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
            <div className="text-xs text-muted-foreground text-center font-medium whitespace-nowrap">
              {new Date(day.date).toLocaleDateString("en-US", {
                month: data.length > 14 ? "short" : "numeric",
                day: "numeric",
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex justify-center space-x-4 sm:space-x-6">
        <div className="flex items-center">
          <div className="w-3 h-3 bg-primary rounded mr-2"></div>
          <span className="text-xs sm:text-sm text-muted-foreground font-medium">
            Activities
          </span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-green-500 rounded mr-2"></div>
          <span className="text-xs sm:text-sm text-muted-foreground font-medium">
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
              <div className="h-4 w-24 text-primary-foreground rounded"></div>
              <div className="h-4 w-12 text-primary-foreground rounded"></div>
            </div>
            <div className="w-full rounded-full h-2"></div>
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
            <span className="text-primary-foreground font-medium">
              {item.label}
            </span>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-primary-foreground">
                {item.value.toLocaleString()}
              </span>
              <span className="text-foreground text-xs">
                ({item.percentage.toFixed(1)}%)
              </span>
            </div>
          </div>
          <div className="w-full bg-card rounded-full h-2 overflow-hidden">
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

        setData(result);
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

      <div className="min-h-screen bg-background p-3 sm:p-4 lg:p-6">
        <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
          {/* Header */}
          <div className="bg-card rounded-xl border border-border p-4 sm:p-6">
            <div className="flex flex-col space-y-4 sm:flex-row sm:justify-between sm:items-start sm:space-y-0">
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-card-foreground">
                  Analytics Dashboard
                </h1>
                <p className="text-sm sm:text-base text-muted-foreground mt-1">
                  System usage and performance metrics
                </p>
                {lastUpdated && (
                  <div className="flex items-center text-xs text-muted-foreground mt-2">
                    <Clock className="h-3 w-3 mr-1" />
                    Last updated: {lastUpdated.toLocaleTimeString()}
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <select
                  value={timeRange}
                  onChange={(e) => setTimeRange(e.target.value)}
                  className="px-3 py-2 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm bg-background disabled:opacity-50 disabled:cursor-not-allowed"
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
                  className="inline-flex items-center justify-center px-4 py-2 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-colors"
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
            <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-3 sm:p-4">
              <div className="flex items-start">
                <AlertCircle className="h-5 w-5 text-destructive mr-3 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <span className="text-destructive text-sm sm:text-base break-words">
                    {error}
                  </span>
                </div>
                <button
                  onClick={() => setError(null)}
                  className="ml-3 bg-destructive/20 hover:bg-destructive/30 text-destructive px-3 py-1 rounded-xl text-sm font-medium transition-colors flex-shrink-0"
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
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 bg-card p-3 sm:p-4 rounded-xl border border-border">
                <MetricCard
                  icon={Database}
                  value={data.centerStats.total}
                  label="Total Centers"
                  subText={`+${data.centerStats.recentlyCreated} this week`}
                  trend={{ value: 8.5, direction: "up" }}
                  color="blue"
                  loading={refreshing}
                  className="bg-background/50 border border-border"
                />
                <MetricCard
                  icon={Globe}
                  value={data.usage.publicAPI}
                  label="API Requests"
                  subText={`${data.usage.apiCallsToday} today`}
                  trend={{ value: 12.3, direction: "up" }}
                  color="green"
                  loading={refreshing}
                  className="bg-background/50 border border-border"
                />
                <MetricCard
                  icon={Users}
                  value={data.usage.activeSessions}
                  label="Active Sessions"
                  subText={`${data.usage.totalSessions} total`}
                  trend={{ value: 5.2, direction: "up" }}
                  color="purple"
                  loading={refreshing}
                  className="bg-background/50 border border-border"
                />
                <MetricCard
                  icon={Activity}
                  value={data.usage.adminActions}
                  label="Admin Actions"
                  subText="CRUD operations"
                  trend={{ value: 2.1, direction: "down" }}
                  color="orange"
                  loading={refreshing}
                  className="bg-background/50 border border-border"
                />
              </div>

              {/* Charts Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 bg-background/20 p-3 sm:p-4 rounded-xl border border-border">
                {/* Activity Trend Chart */}
                <div className="bg-background/50 rounded-xl border border-border p-4 sm:p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-base sm:text-lg font-semibold text-card-foreground">
                      Activity Trend
                    </h3>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <TrendingUp className="h-4 w-4 mr-1" />
                      {timeRange}
                    </div>
                  </div>
                  <div className="w-full overflow-x-auto">
                    <div
                      className="min-w-[300px] sm:min-w-[400px] md:min-w-[500px] lg:min-w-0"
                      style={{ height: "280px" }}
                    >
                      <ActivityChart
                        data={data.trends}
                        loading={refreshing}
                        timeRange={timeRange}
                      />
                    </div>
                  </div>
                </div>

                {/* Usage Distribution */}
                <div className="bg-card rounded-xl border border-border p-4 sm:p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-base sm:text-lg font-semibold text-card-foreground">
                      Usage Distribution
                    </h3>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <BarChart3 className="h-4 w-4 mr-1" />
                      Current period
                    </div>
                  </div>
                  <UsageDistribution data={data.usage} loading={refreshing} />
                </div>
              </div>

              {/* System Health */}
              <div className="bg-card rounded-xl border border-border p-4 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base sm:text-lg font-semibold text-card-foreground">
                    System Health
                  </h3>
                  <div className="flex items-center text-sm text-success">
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
                      trend={null}
                      loading={false}
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
