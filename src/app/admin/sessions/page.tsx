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
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Active Sessions</h1>
          <p className="text-gray-600">
            Monitor and manage your active login sessions
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={loadSessions}
            disabled={loading}
            className="btn btn-secondary flex items-center"
          >
            <RefreshCw
              className={`h-5 w-5 mr-2 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </button>
          <button
            onClick={revokeAllSessions}
            disabled={revoking}
            className="btn btn-danger flex items-center"
          >
            {revoking ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full spinner mr-2"></div>
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
      <div className="card">
        {loading ? (
          <div className="p-8 text-center">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full spinner mx-auto mb-4"></div>
            <p className="text-gray-600">Loading sessions...</p>
          </div>
        ) : sessions.length === 0 ? (
          <div className="p-8 text-center">
            <Shield className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No active sessions found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead className="table-header">
                <tr>
                  <th className="table-cell text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Session
                  </th>
                  <th className="table-cell text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="table-cell text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Used
                  </th>
                  <th className="table-cell text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Expires
                  </th>
                  <th className="table-cell text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sessions.map((session, index) => (
                  <tr key={session.id} className="hover:bg-gray-50">
                    <td className="table-cell">
                      <div className="flex items-center">
                        <Monitor className="h-5 w-5 text-gray-400 mr-3" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            Session #{index + 1}
                          </div>
                          <div className="text-xs text-gray-500 font-mono">
                            {session.sessionId.substring(0, 8)}...
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="table-cell text-gray-500">
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-2 text-gray-400" />
                        {formatDate(session.createdAt)}
                      </div>
                    </td>
                    <td className="table-cell text-gray-500">
                      {formatDate(session.lastUsed)}
                    </td>
                    <td className="table-cell text-gray-500">
                      {formatDate(session.expiresAt)}
                    </td>
                    <td className="table-cell">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          isExpiringSoon(session.expiresAt)
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-green-100 text-green-800"
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
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-start">
          <Shield className="h-6 w-6 text-blue-600 mr-3 mt-0.5" />
          <div>
            <h3 className="text-sm font-medium text-blue-900 mb-2">
              Session Security
            </h3>
            <div className="text-sm text-blue-800 space-y-1">
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
