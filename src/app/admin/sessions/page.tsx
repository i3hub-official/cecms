"use client";

import { useState, useEffect } from "react";
import {
  Shield,
  Clock,
  Monitor,
  AlertTriangle,
  RefreshCw,
  LogOut,
} from "lucide-react";

interface Session {
  id: string;
  sessionId: string;
  createdAt: string;
  lastUsed: string;
  expiresAt: string;
  deviceInfo?: string;
  location?: string;
}

export default function SessionsPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(false);
  const [revoking, setRevoking] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

  const loadSessions = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("auth_token");
      const response = await fetch("/api/sessions", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        setSessions(data.data);
        // Set the current session ID (assuming the first one is current or API provides this info)
        if (data.data.length > 0) {
          setCurrentSessionId(data.data[0].id);
        }
      }
    } catch (error) {
      console.error("Failed to load sessions:", error);
    } finally {
      setLoading(false);
    }
  };

  const revokeAllSessions = async () => {
    if (
      !window.confirm(
        "Are you sure you want to revoke all sessions? You will be logged out from all devices."
      )
    ) {
      return;
    }

    setRevoking(true);
    try {
      const token = localStorage.getItem("auth_token");
      const response = await fetch("/api/admin/sessions", {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        // Clear local storage and redirect
        localStorage.clear();
        window.location.href = "/auth/signin?message=All sessions revoked";
      }
    } catch (error) {
      console.error("Failed to revoke sessions:", error);
    } finally {
      setRevoking(false);
    }
  };

  const revokeSession = async (sessionId: string) => {
    if (
      !window.confirm(
        "Are you sure you want to revoke this session? The user will be logged out from this device."
      )
    ) {
      return;
    }

    try {
      const token = localStorage.getItem("auth_token");
      const response = await fetch(`/api/admin/sessions/${sessionId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        // Remove the session from the list
        setSessions(sessions.filter((session) => session.id !== sessionId));

        // If it's the current session, log out
        if (sessionId === currentSessionId) {
          localStorage.clear();
          window.location.href = "/auth/signin?message=Session revoked";
        }
      }
    } catch (error) {
      console.error("Failed to revoke session:", error);
    }
  };

  useEffect(() => {
    loadSessions();
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const isExpiringSoon = (expiresAt: string) => {
    const expires = new Date(expiresAt);
    const now = new Date();
    const hoursLeft = (expires.getTime() - now.getTime()) / (1000 * 60 * 60);
    return hoursLeft < 2;
  };

  const getTimeRemaining = (expiresAt: string) => {
    const expires = new Date(expiresAt);
    const now = new Date();
    const hoursLeft = (expires.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (hoursLeft < 1) {
      const minutesLeft = Math.floor(hoursLeft * 60);
      return `${minutesLeft} min`;
    } else if (hoursLeft < 24) {
      return `${Math.floor(hoursLeft)} hours`;
    } else {
      const daysLeft = Math.floor(hoursLeft / 24);
      return `${daysLeft} days`;
    }
  };

  return (
    <div className="p-6 space-y-6 bg-background text-foreground max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Active Sessions</h1>
          <p className="text-muted-foreground">
            Monitor and manage your active login sessions
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <button
            onClick={loadSessions}
            disabled={loading}
            className="flex items-center justify-center px-4 py-2 text-sm font-medium rounded-lg border border-border bg-background text-foreground hover:bg-accent transition-colors disabled:opacity-50"
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </button>
          <button
            onClick={revokeAllSessions}
            disabled={revoking || sessions.length <= 1}
            className="flex items-center justify-center px-4 py-2 text-sm font-medium rounded-lg bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors disabled:opacity-50"
          >
            {revoking ? (
              <>
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2"></div>
                Revoking...
              </>
            ) : (
              <>
                <LogOut className="h-4 w-4 mr-2" />
                Revoke All Others
              </>
            )}
          </button>
        </div>
      </div>

      {/* Current Session Card */}
      {sessions.length > 0 && currentSessionId && (
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold flex items-center">
              <Monitor className="h-5 w-5 mr-2 text-primary" />
              Current Session
            </h2>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/20 text-primary">
              <Shield className="h-3 w-3 mr-1" />
              Active
            </span>
          </div>

          {sessions
            .filter((session) => session.id === currentSessionId)
            .map((session) => (
              <div
                key={session.id}
                className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm"
              >
                <div>
                  <p className="text-muted-foreground">Device</p>
                  <p className="font-medium">
                    {session.deviceInfo || "This device"}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Last Activity</p>
                  <p className="font-medium">{formatDate(session.lastUsed)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Expires in</p>
                  <p className="font-medium">
                    {getTimeRemaining(session.expiresAt)}
                  </p>
                </div>
              </div>
            ))}
        </div>
      )}

      {/* Other Sessions */}
      <div className="bg-background text-foreground rounded-xl shadow-sm border border-border p-6 transition-colors duration-300">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Other Active Sessions</h2>
          <span className="text-sm text-muted-foreground">
            {sessions.filter((s) => s.id !== currentSessionId).length} sessions
          </span>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading sessions...</p>
          </div>
        ) : sessions.filter((s) => s.id !== currentSessionId).length === 0 ? (
          <div className="p-8 text-center">
            <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              No other active sessions found
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-accent">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Device & Location
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Signed In
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Last Activity
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {sessions
                  .filter((session) => session.id !== currentSessionId)
                  .map((session, index) => (
                    <tr
                      key={session.id}
                      className="hover:bg-accent transition-colors"
                    >
                      <td className="px-4 py-4">
                        <div className="flex items-center">
                          <Monitor className="h-5 w-5 text-muted-foreground mr-3" />
                          <div>
                            <div className="text-sm font-medium">
                              {session.deviceInfo || `Device ${index + 1}`}
                            </div>
                            {session.location && (
                              <div className="text-xs text-muted-foreground">
                                {session.location}
                              </div>
                            )}
                            <div className="text-xs text-muted-foreground font-mono mt-1">
                              ID: {session.sessionId.substring(0, 8)}...
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-muted-foreground">
                        {formatDate(session.createdAt)}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-muted-foreground">
                        {formatDate(session.lastUsed)}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            isExpiringSoon(session.expiresAt)
                              ? "bg-amber-100 text-amber-800"
                              : "bg-primary/20 text-primary"
                          }`}
                        >
                          {isExpiringSoon(session.expiresAt) ? (
                            <>
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              Expires in {getTimeRemaining(session.expiresAt)}
                            </>
                          ) : (
                            <>
                              <Shield className="h-3 w-3 mr-1" />
                              Active
                            </>
                          )}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() => revokeSession(session.id)}
                          className="text-destructive hover:text-destructive/80 transition-colors flex items-center"
                        >
                          <LogOut className="h-4 w-4 mr-1" />
                          Revoke
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Security Info */}
      <div className="bg-primary/5 border border-primary/20 rounded-xl p-5">
        <div className="flex items-start">
          <Shield className="h-5 w-5 text-primary mr-3 mt-0.5" />
          <div>
            <h3 className="text-sm font-medium mb-2">Session Security</h3>
            <div className="text-sm text-muted-foreground space-y-1">
              <p>
                • Sessions automatically expire after 24 hours of inactivity
              </p>
              <p>• Each login creates a new session with unique tracking</p>
              <p>• Revoke suspicious sessions to protect your account</p>
              <p>• Always log out from shared devices</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
