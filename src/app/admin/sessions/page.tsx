"use client";

import { useState, useEffect } from "react";
import {
  Shield,
  Clock,
  Monitor,
  AlertTriangle,
  RefreshCw,
  LogOut,
  X,
  Trash2,
  Info,
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

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText: string;
  isDestructive?: boolean;
  loading?: boolean;
}

const ConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText,
  isDestructive = false,
  loading = false,
}: ConfirmModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-background border border-border rounded-xl max-w-md w-full mx-4 shadow-xl">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-accent rounded-lg transition-colors"
            disabled={loading}
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-4">
          <p className="text-muted-foreground mb-6">{message}</p>
          <div className="flex flex-col-reverse sm:flex-row gap-3">
            <button
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-2 text-sm font-medium rounded-lg border border-border bg-background hover:bg-accent transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={loading}
              className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 ${
                isDestructive
                  ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  : "bg-primary text-primary-foreground hover:bg-primary/90"
              }`}
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2"></div>
                  Processing...
                </div>
              ) : (
                confirmText
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function SessionsPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(false);
  const [revoking, setRevoking] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    type: "revokeAll" | "revokeSession" | null;
    sessionId?: string;
  }>({ isOpen: false, type: null });

  const loadSessions = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/sessions", {
        credentials: "include",
      });

      const data = await response.json();

      if (data.success) {
        setSessions(data.data);
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

  const handleRevokeAll = async () => {
    setRevoking(true);
    try {
      const response = await fetch("/api/sessions", {
        method: "DELETE",
        credentials: "include",
      });

      const data = await response.json();

      if (data.success) {
        if (typeof localStorage !== "undefined") {
          localStorage.clear();
        }
        window.location.href = "/auth/signin?message=All sessions revoked";
      }
    } catch (error) {
      console.error("Failed to revoke sessions:", error);
    } finally {
      setRevoking(false);
      setModalState({ isOpen: false, type: null });
    }
  };

  const handleRevokeSession = async (sessionId: string) => {
    setRevoking(true);
    try {
      const response = await fetch(`/api/sessions/${sessionId}`, {
        method: "DELETE",
        credentials: "include",
      });

      const data = await response.json();

      if (data.success) {
        setSessions(sessions.filter((session) => session.id !== sessionId));
        if (sessionId === currentSessionId) {
          if (typeof localStorage !== "undefined") {
            localStorage.clear();
          }
          window.location.href = "/auth/signin?message=Session revoked";
        }
      }
    } catch (error) {
      console.error("Failed to revoke session:", error);
    } finally {
      setRevoking(false);
      setModalState({ isOpen: false, type: null });
    }
  };

  const openModal = (
    type: "revokeAll" | "revokeSession",
    sessionId?: string
  ) => {
    setModalState({ isOpen: true, type, sessionId });
  };

  const closeModal = () => {
    setModalState({ isOpen: false, type: null });
  };

  const handleModalConfirm = () => {
    if (modalState.type === "revokeAll") {
      handleRevokeAll();
    } else if (modalState.type === "revokeSession" && modalState.sessionId) {
      handleRevokeSession(modalState.sessionId);
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

  const otherSessions = sessions.filter((s) => s.id !== currentSessionId);

  return (
    <div className="min-h-screen bg-background">
      <div className="p-4 space-y-4 max-w-6xl mx-auto">
        {/* Mobile Header */}
        <div className="space-y-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">Active Sessions</h1>
            <p className="text-sm text-muted-foreground">
              Monitor and manage your active login sessions
            </p>
          </div>

          {/* Mobile Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={loadSessions}
              disabled={loading}
              className="flex items-center justify-center px-4 py-2.5 text-sm font-medium rounded-lg border border-border bg-background hover:bg-accent transition-colors disabled:opacity-50"
            >
              <RefreshCw
                className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
              />
              Refresh
            </button>
            <button
              onClick={() => openModal("revokeAll")}
              disabled={revoking || sessions.length <= 1}
              className="flex items-center justify-center px-4 py-2.5 text-sm font-medium rounded-lg bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors disabled:opacity-50"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Revoke All Others
            </button>
          </div>
        </div>

        {/* Current Session Card - Mobile First */}
        {sessions.length > 0 && currentSessionId && (
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <h2 className="text-lg font-semibold flex items-center">
                <Monitor className="h-5 w-5 mr-2 text-primary" />
                Current Session
              </h2>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/20 text-primary w-fit">
                <Shield className="h-3 w-3 mr-1" />
                Active
              </span>
            </div>

            {sessions
              .filter((session) => session.id === currentSessionId)
              .map((session) => (
                <div
                  key={session.id}
                  className="space-y-3 sm:space-y-0 sm:grid sm:grid-cols-3 sm:gap-4 text-sm"
                >
                  <div>
                    <p className="text-muted-foreground font-medium">Device</p>
                    <p className="mt-1">
                      {session.deviceInfo || "This device"}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground font-medium">
                      Last Activity
                    </p>
                    <p className="mt-1">{formatDate(session.lastUsed)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground font-medium">
                      Expires in
                    </p>
                    <p className="mt-1">
                      {getTimeRemaining(session.expiresAt)}
                    </p>
                  </div>
                </div>
              ))}
          </div>
        )}

        {/* Other Sessions - Mobile Cards */}
        <div className="bg-background border border-border rounded-xl p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mb-4">
            <h2 className="text-lg font-semibold">Other Active Sessions</h2>
            <span className="text-sm text-muted-foreground">
              {otherSessions.length} sessions
            </span>
          </div>

          {loading ? (
            <div className="py-12 text-center">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading sessions...</p>
            </div>
          ) : otherSessions.length === 0 ? (
            <div className="py-12 text-center">
              <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                No other active sessions found
              </p>
            </div>
          ) : (
            <>
              {/* Mobile Cards */}
              <div className="block sm:hidden space-y-3">
                {otherSessions.map((session, index) => (
                  <div
                    key={session.id}
                    className="border border-border rounded-lg p-4 bg-background hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-start">
                        <Monitor className="h-5 w-5 text-muted-foreground mr-3 mt-0.5" />
                        <div className="flex-1">
                          <div className="font-medium text-sm">
                            {session.deviceInfo || `Device ${index + 1}`}
                          </div>
                          {session.location && (
                            <div className="text-xs text-muted-foreground mt-1">
                              {session.location}
                            </div>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => openModal("revokeSession", session.id)}
                        className="text-destructive hover:text-destructive/80 p-1 rounded transition-colors"
                      >
                        <LogOut className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Signed in:
                        </span>
                        <span>{formatDate(session.createdAt)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Last active:
                        </span>
                        <span>{formatDate(session.lastUsed)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Status:</span>
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            isExpiringSoon(session.expiresAt)
                              ? "bg-destructive/10 text-destructive"
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
                      </div>
                      <div className="pt-1">
                        <span className="text-muted-foreground font-mono text-xs">
                          ID: {session.sessionId.substring(0, 8)}...
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop Table */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-accent/50">
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
                    {otherSessions.map((session, index) => (
                      <tr
                        key={session.id}
                        className="hover:bg-accent/50 transition-colors"
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
                                ? "bg-destructive/10 text-destructive"
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
                            onClick={() =>
                              openModal("revokeSession", session.id)
                            }
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
            </>
          )}
        </div>

        {/* Security Info */}
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
          <div className="flex items-start">
            <Info className="h-5 w-5 text-primary mr-3 mt-0.5 flex-shrink-0" />
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

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={modalState.isOpen}
        onClose={closeModal}
        onConfirm={handleModalConfirm}
        title={
          modalState.type === "revokeAll"
            ? "Revoke All Sessions"
            : "Revoke Session"
        }
        message={
          modalState.type === "revokeAll"
            ? "Are you sure you want to revoke all other sessions? Users will be logged out from all other devices."
            : "Are you sure you want to revoke this session? The user will be logged out from this device."
        }
        confirmText={
          modalState.type === "revokeAll" ? "Revoke All" : "Revoke Session"
        }
        isDestructive
        loading={revoking}
      />
    </div>
  );
}
