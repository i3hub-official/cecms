"use client";

import { useState, useEffect } from "react";
import { Shield, Clock, Monitor, AlertTriangle, RefreshCw } from "lucide-react";

interface Session {
  id: string;
  sessionId: string;
  createdAt: string;
  lastUsed: string;
  expiresAt: string;
}

export default function SessionsPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(false);
  const [revoking, setRevoking] = useState(false);

  const loadSessions = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("auth_token");
      const response = await fetch("/api/admin/sessions", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        setSessions(data.data);
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
        "Are you sure you want to revoke all sessions? You will be logged out."
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

  return (
    <div className="p-6 space-y-6 bg-background text-foreground">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Active Sessions</h1>
          <p className="text-muted-foreground">
            Monitor and manage your active login sessions
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={loadSessions}
            disabled={loading}
            className="flex items-center px-4 py-2 text-sm font-medium rounded-lg border border-border bg-background text-foreground hover:bg-accent transition-colors disabled:opacity-50"
          >
            <RefreshCw
              className={`h-5 w-5 mr-2 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </button>
          <button
            onClick={revokeAllSessions}
            disabled={revoking}
            className="flex items-center px-4 py-2 text-sm font-medium rounded-lg bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors disabled:opacity-50"
          >
            {revoking ? (
              <>
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2"></div>
                Revoking...
              </>
            ) : (
              <>
                <Shield className="h-5 w-5 mr-2" />
                Revoke All
              </>
            )}
          </button>
        </div>
      </div>

      {/* Sessions List */}
      <div className="bg-background text-foreground rounded-2xl shadow-sm border border-border p-6 transition-colors duration-300">
        {loading ? (
          <div className="p-8 text-center">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading sessions...</p>
          </div>
        ) : sessions.length === 0 ? (
          <div className="p-8 text-center">
            <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No active sessions found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-accent">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Session
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Last Used
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Expires
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {sessions.map((session, index) => (
                  <tr key={session.id} className="hover:bg-accent transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Monitor className="h-5 w-5 text-muted-foreground mr-3" />
                        <div>
                          <div className="text-sm font-medium">
                            Session #{index + 1}
                          </div>
                          <div className="text-xs text-muted-foreground font-mono">
                            {session.sessionId.substring(0, 8)}...
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-muted-foreground">
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                        {formatDate(session.createdAt)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-muted-foreground">
                      {formatDate(session.lastUsed)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-muted-foreground">
                      {formatDate(session.expiresAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          isExpiringSoon(session.expiresAt)
                            ? "bg-accent text-accent-foreground"
                            : "bg-primary/20 text-primary"
                        }`}
                      >
                        {isExpiringSoon(session.expiresAt) ? (
                          <>
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Expiring Soon
                          </>
                        ) : (
                          <>
                            <Shield className="h-3 w-3 mr-1" />
                            Active
                          </>
                        )}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Security Info */}
      <div className="bg-primary/10 border border-primary/20 rounded-lg p-6">
        <div className="flex items-start">
          <Shield className="h-6 w-6 text-primary mr-3 mt-0.5" />
          <div>
            <h3 className="text-sm font-medium mb-2">
              Session Security
            </h3>
            <div className="text-sm text-muted-foreground space-y-1">
              <p>
                • Sessions automatically expire after 24 hours of inactivity
              </p>
              <p>• Each login creates a new session with unique tracking</p>
              <p>• Revoke all sessions if you suspect unauthorized access</p>
              <p>• Always log out from shared devices</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}