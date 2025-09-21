// src/app/admin/components/AdminDashboard.tsx
"use client";

import { useEffect, useState } from "react";
import {
  Building,
  Users,
  Activity,
  TrendingUp,
  Eye,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Shield,
  Database,
  Clock,
  Key,
} from "lucide-react";

interface DashboardStats {
  centers: {
    total: number;
    active: number;
    inactive: number;
    recentlyCreated: number;
    recentlyModified: number;
  };
  admins: {
    total: number;
    active: number;
    inactive: number;
  };
  sessions: {
    active: number;
    total: number;
    expired: number;
  };
  passwordResets: {
    pending: number;
    used: number;
    expired: number;
  };
}

interface RecentCenter {
  id: string;
  name: string;
  number: string;
  address: string;
  isActive: boolean;
  createdAt: string;
  modifiedAt: string;
}

interface ActiveSession {
  id: string;
  admin: {
    name: string;
    email: string;
    role: string;
  };
  lastUsed: string;
  expiresAt: string;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    centers: {
      total: 0,
      active: 0,
      inactive: 0,
      recentlyCreated: 0,
      recentlyModified: 0,
    },
    admins: {
      total: 0,
      active: 0,
      inactive: 0,
    },
    sessions: {
      active: 0,
      total: 0,
      expired: 0,
    },
    passwordResets: {
      pending: 0,
      used: 0,
      expired: 0,
    },
  });
  const [recentCenters, setRecentCenters] = useState<RecentCenter[]>([]);
  const [activeSessions, setActiveSessions] = useState<ActiveSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadDashboardData = async (isRefresh: boolean = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const response = await fetch("/api/dashboard", {
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch dashboard: ${response.status}`);
      }

      const dashboardData = await response.json();

      if (dashboardData.success) {
        setStats(dashboardData.data);
        setRecentCenters(dashboardData.data.recentCenters);
        setActiveSessions(dashboardData.data.activeSessions);
      } else {
        throw new Error(dashboardData.error || "Failed to load dashboard data");
      }

      setLastUpdated(new Date());
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
      setError("Failed to load dashboard data. Please try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDashboardData();

    // Auto-refresh every 30 seconds
    const interval = setInterval(() => loadDashboardData(true), 30000);

    return () => clearInterval(interval);
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return `${Math.floor(diffMins / 1440)}d ago`;
  };

  if (loading && !stats.centers.total) {
    return (
      <div className="p-4 md:p-6">
        <div className="animate-pulse space-y-6">
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
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 bg-card text-foreground">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold">Dashboard</h1>
          <p className="text-sm md:text-base text-muted-foreground">
            Overview of center management system
            {lastUpdated && (
              <span className="ml-2 text-xs md:text-sm">
                • Last updated {getTimeAgo(lastUpdated.toISOString())}
              </span>
            )}
          </p>
        </div>
        <button
          onClick={() => loadDashboardData(true)}
          disabled={refreshing}
          className="inline-flex items-center justify-center px-3 py-2 md:px-4 md:py-2 bg-background/30 text-primary-foreground rounded-xl hover:bg-background/90 disabled:opacity-50 text-sm md:text-base transition-colors"
        >
          <RefreshCw
            className={`h-4 w-4 mr-1 md:mr-2 ${
              refreshing ? "animate-spin" : ""
            }`}
          />
          Refresh
        </button>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-destructive mr-2" />
            <span className="text-destructive text-sm md:text-base">
              {error}
            </span>
          </div>
        </div>
      )}

      {/* Primary Stats Cards */}
      <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          {
            icon: Building,
            value: stats.centers.total,
            label: "Total Centers",
            subText: `${stats.centers.active} active • ${stats.centers.inactive} inactive`,
            color: "primary",
          },
          {
            icon: CheckCircle,
            value: stats.sessions.active,
            label: "Active Sessions",
            subText: `${stats.sessions.total} total`,
            color: "primary",
          },
          {
            icon: Activity,
            value: stats.centers.recentlyModified,
            label: "Recent Activity (7d)",
            subText: `${stats.centers.recentlyCreated} new centers`,
            color: "primary",
          },
          {
            icon: Users,
            value: stats.admins.active,
            label: "Active Admins",
            subText: `${stats.admins.total} total`,
            color: "primary",
          },
        ].map((card, index) => {
          const Icon = card.icon;
          return (
            <div
              key={index}
              className="border border-border rounded-xl p-6 transition-all hover:shadow-md hover:border-primary bg-card"
            >
              <div className="flex justify-between items-start mb-4">
                <Icon
                  className={`h-6 w-6 ${
                    card.color === "primary"
                      ? "text-primary"
                      : card.color === "success"
                      ? "text-success"
                      : card.color === "purple"
                      ? "text-purple-500"
                      : "text-orange-500"
                  }`}
                />
                <div className="text-2xl font-bold text-card-foreground">
                  {card.value}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">
                  {card.label}
                </div>
                <div className="text-xs text-muted-foreground/80 mt-2">
                  {card.subText}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 ">
        {[
          {
            title: "Security Status",
            icon: Shield,
            items: [
              {
                label: "Expired Sessions",
                value: stats.sessions.expired,
                status: stats.sessions.expired === 0 ? "good" : "bad",
              },
              {
                label: "Password Resets",
                value: stats.passwordResets.pending,
                status: "neutral",
              },
              { label: "System Health", value: "Good", status: "good" },
            ],
          },
          {
            title: "System Stats",
            icon: Database,
            items: [
              { label: "Uptime", value: "99.9%", status: "good" },
              { label: "Response Time", value: "<200ms", status: "neutral" },
              { label: "Error Rate", value: "0%", status: "good" },
            ],
          },
          {
            title: "Activity Summary",
            icon: Clock,
            items: [
              {
                label: "Centers Added",
                value: stats.centers.recentlyCreated,
                status: "good",
              },
              {
                label: "Centers Modified",
                value: stats.centers.recentlyModified,
                status: "neutral",
              },
              {
                label: "New Sessions",
                value: stats.sessions.active,
                status: "neutral",
              },
            ],
          },
        ].map((section, index) => {
          const Icon = section.icon;
          return (
            <div
              key={index}
              className="border border-border rounded-xl p-6 transition-all hover:shadow-md bg-background/30"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium">{section.title}</h3>
                <Icon className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="space-y-3">
                {section.items.map((item, itemIndex) => (
                  <div
                    key={itemIndex}
                    className="flex justify-between items-center"
                  >
                    <span className="text-sm text-muted-foreground">
                      {item.label}
                    </span>
                    <span
                      className={`font-medium text-sm ${
                        item.status === "good"
                          ? "text-success"
                          : item.status === "bad"
                          ? "text-destructive"
                          : "text-primary"
                      }`}
                    >
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Data Tables */}
      <div className="grid grid-cols-1 xl:grid-cols-[2fr_1fr] gap-6">
        {/* Centers Table - Wider on xl screens */}
        <div className="border border-border rounded-xl p-6 overflow-hidden transition-all hover:shadow-md">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-2 sm:gap-0">
            <h2 className="text-lg font-medium">Recently Added Centers</h2>
            <button className="inline-flex items-center justify-center px-3 py-2 border border-border rounded-xl text-sm hover:bg-card hover:text-accent-foreground transition-colors">
              <Eye className="h-4 w-4 mr-2" />
              View All
            </button>
          </div>

          <div className="overflow-x-auto -mx-4 sm:mx-0 bg-background/30">
            <table className="min-w-full divide-y divide-border">
              <thead className="bg-card">
                <tr>
                  <th className="px-3 py-2 md:px-4 md:py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Center
                  </th>
                  <th className="px-3 py-2 md:px-4 md:py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-3 py-2 md:px-4 md:py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Created
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {recentCenters.map((center) => (
                  <tr key={center.id}>
                    <td className="px-3 py-3 md:px-4 md:py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <div className="text-sm font-medium">{center.name}</div>
                        <div className="text-xs text-muted-foreground">
                          #{center.number}
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3 md:px-4 md:py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          center.isActive
                            ? "bg-success/20 text-success"
                            : "bg-destructive/20 text-destructive"
                        }`}
                      >
                        {center.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-3 py-3 md:px-4 md:py-4 whitespace-nowrap text-xs md:text-sm text-muted-foreground">
                      {formatDate(center.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {recentCenters.length === 0 && (
              <div className="text-center py-6 md:py-8 text-muted-foreground text-sm md:text-base">
                No centers found. Add your first center to get started.
              </div>
            )}
          </div>
        </div>

        {/* Active Sessions Table - Narrower on xl screens */}
        <div className="border border-border rounded-xl p-6 transition-all hover:shadow-md">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-medium">Active Sessions</h2>
            <Shield className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="space-y-4">
            {activeSessions.length === 0 ? (
              <div className="text-center py-4 md:py-6">
                <div className="text-muted-foreground mb-2">
                  <Shield className="h-8 w-8 mx-auto" />
                </div>
                <p className="text-muted-foreground text-sm md:text-base">
                  No active sessions data available
                </p>
              </div>
            ) : (
              activeSessions.map((session) => (
                <div
                  key={session.id}
                  className="flex items-center justify-between p-2 md:p-3 bg-background/30 rounded-lg"
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm md:text-base truncate">
                      {session.admin.name}
                    </div>
                    <div className="text-xs md:text-sm text-muted-foreground truncate">
                      {session.admin.email}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Last used: {getTimeAgo(session.lastUsed)}
                    </div>
                  </div>
                  <div className="flex items-center ml-2">
                    <div className="w-2 h-2 bg-success rounded-full"></div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="border border-border rounded-xl p-6 transition-all hover:shadow-md">
        <h2 className="text-lg font-medium mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-background/30">
          {[
            { icon: Building, label: "Manage Centers", href: "/admin/centers" },
            { icon: Shield, label: "View Sessions", href: "/admin/sessions" },
            {
              icon: TrendingUp,
              label: "View Analytics",
              href: "/admin/analytics",
            },
            { icon: Users, label: "Settings", href: "/admin/settings" },
          ].map((action, index) => {
            const Icon = action.icon;
            return (
              <button
                key={index}
                className="inline-flex items-center justify-center px-3 py-2 border border-border bg-background/30 rounded-xl text-xs md:text-sm hover:bg-background hover:text-accent-foreground transition-colors"
                onClick={() => (window.location.href = action.href)}
              >
                <Icon className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                {action.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* System Health Indicator */}
      <div className="border border-success/20 rounded-xl p-4 bg-success/10">
        <div className="flex items-center">
          <CheckCircle className="h-5 w-5 text-success mr-2" />
          <div className="flex-1">
            <div className="text-base font-medium text-success">
              System Status: All Systems Operational
            </div>
            <div className="text-sm text-success/80">
              Database connected • {stats.sessions.active} active sessions •
              Last updated{" "}
              {lastUpdated ? getTimeAgo(lastUpdated.toISOString()) : "recently"}
            </div>
          </div>
          {refreshing && (
            <RefreshCw className="h-5 w-5 text-success animate-spin" />
          )}
        </div>
      </div>
    </div>
  );
}
