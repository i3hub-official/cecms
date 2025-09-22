"use client";

import { useState, useEffect, useRef } from "react";
import {
  Settings,
  User,
  Shield,
  Save,
  Eye,
  EyeOff,
  Lock,
  Clock,
  Monitor,
  Smartphone,
  Globe,
  LogOut,
  X,
  CheckCircle,
  AlertCircle,
  Sun,
  Moon,
  Laptop,
} from "lucide-react";
import { notifySuccess, notifyError } from "@/app/components/ui/notifications";
import { useTheme } from "@/app/components/ThemeContext";
import Loading from "@/app/components/ui/Loading";

// Separate Modal Component
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxWidth?: string;
}

const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = "max-w-md",
}: ModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div
        className={`bg-background border border-border rounded-2xl ${maxWidth} w-full mx-4 shadow-2xl transform transition-all duration-200 scale-100`}
      >
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h3 className="text-lg font-semibold text-foreground">{title}</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-accent rounded-full transition-colors duration-200"
          >
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
};

// Confirmation Modal Component
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
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="space-y-4">
        <div className="flex items-start">
          {isDestructive ? (
            <AlertCircle className="h-5 w-5 text-destructive mr-3 mt-0.5 flex-shrink-0" />
          ) : (
            <CheckCircle className="h-5 w-5 text-primary mr-3 mt-0.5 flex-shrink-0" />
          )}
          <p className="text-muted-foreground leading-relaxed">{message}</p>
        </div>
        <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-5 py-2.5 text-sm font-medium rounded-lg border border-border bg-background hover:bg-accent transition-all duration-200 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 px-5 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 disabled:opacity-50 ${
              isDestructive
                ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                : "bg-primary text-primary-foreground hover:bg-primary/90"
            } shadow-md hover:shadow-lg`}
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <Loading size="sm" variant="spinner" message="" />
                <span className="ml-2">Processing...</span>
              </div>
            ) : (
              confirmText
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
};

// Session Card Component
interface SessionCardProps {
  session: Session;
  isCurrentSession?: boolean;
  onRevoke?: (sessionId: string) => void;
}

const SessionCard = ({
  session,
  isCurrentSession = false,
  onRevoke,
}: SessionCardProps) => {
  const getDeviceIcon = (deviceInfo?: string) => {
    if (!deviceInfo) return Monitor;
    if (deviceInfo.toLowerCase().includes("mobile")) return Smartphone;
    return Monitor;
  };

  const DeviceIcon = getDeviceIcon(session.deviceInfo);

  return (
    <div
      className={`border rounded-lg p-4 transition-all duration-200 ${
        isCurrentSession
          ? "border-primary/50 bg-primary/5"
          : "border-border hover:bg-accent/30"
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3">
          <DeviceIcon
            className={`h-5 w-5 mt-0.5 ${
              isCurrentSession ? "text-primary" : "text-muted-foreground"
            }`}
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <p className="font-medium text-sm">
                {session.deviceInfo || "Unknown Device"}
              </p>
              {isCurrentSession && (
                <span className="px-2 py-0.5 text-xs bg-primary/20 text-primary rounded-full font-medium">
                  Current
                </span>
              )}
            </div>
            <div className="space-y-1 text-xs text-muted-foreground">
              <p className="flex items-center">
                <Globe className="h-3 w-3 mr-1" />
                {session.location || session.ipAddress || "Unknown location"}
              </p>
              <p className="flex items-center">
                <Clock className="h-3 w-3 mr-1" />
                Last used: {new Date(session.lastUsed).toLocaleString()}
              </p>
              <p className="flex items-center">
                <Shield className="h-3 w-3 mr-1" />
                Expires: {new Date(session.expiresAt).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
        {!isCurrentSession && onRevoke && (
          <button
            onClick={() => onRevoke(session.id)}
            className="p-2 text-destructive hover:text-destructive-foreground hover:bg-destructive/90 rounded-lg transition-all duration-200 border border-destructive/20 hover:border-destructive"
            title="Revoke Session"
          >
            <LogOut className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
};

interface Session {
  id: string;
  sessionId: string;
  createdAt: string;
  lastUsed: string;
  expiresAt: string;
  deviceInfo?: string;
  ipAddress?: string;
  location?: string;
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("profile");
  const [loading, setLoading] = useState(false);
  const { darkMode, toggleTheme } = useTheme();
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());

  const [user, setUser] = useState({
    name: "",
    email: "",
    phone: "",
    role: "",
    createdAt: "",
    lastLogin: "",
  });

  const [profileData, setProfileData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const [preferences, setPreferences] = useState({
    autoLogoutMinutes: 30,
    theme: "system" as "light" | "dark" | "system",
  });

  const [sessions, setSessions] = useState<Session[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText: string;
    isDestructive: boolean;
    action: () => void;
  }>({
    isOpen: false,
    title: "",
    message: "",
    confirmText: "",
    isDestructive: false,
    action: () => {},
  });

  // Auto logout functionality
  useEffect(() => {
    const resetInactivityTimer = () => {
      lastActivityRef.current = Date.now();

      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }

      inactivityTimerRef.current = setTimeout(() => {
        notifyError("Session expired due to inactivity. Logging out...");
        setTimeout(() => {
          window.location.href = "/auth/signin?message=Session expired";
        }, 2000);
      }, preferences.autoLogoutMinutes * 60 * 1000);
    };

    const handleActivity = () => {
      resetInactivityTimer();
    };

    // Set up activity listeners
    const events = [
      "mousedown",
      "mousemove",
      "keypress",
      "scroll",
      "touchstart",
      "click",
    ];
    events.forEach((event) => {
      document.addEventListener(event, handleActivity, true);
    });

    // Start timer
    resetInactivityTimer();

    return () => {
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
      events.forEach((event) => {
        document.removeEventListener(event, handleActivity, true);
      });
    };
  }, [preferences.autoLogoutMinutes]);

  // Load initial data
  useEffect(() => {
    loadProfileData();
    if (activeTab === "security") {
      loadSessions();
    }
  }, [activeTab]);

  // Initialize theme preference from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    if (
      savedTheme &&
      (savedTheme === "light" ||
        savedTheme === "dark" ||
        savedTheme === "system")
    ) {
      setPreferences((prev) => ({
        ...prev,
        theme: savedTheme as "light" | "dark" | "system",
      }));
    }
  }, []);

  const loadProfileData = async () => {
    try {
      const response = await fetch("/api/admin/profile", {
        credentials: "include",
      });
      const data = await response.json();
      if (data.success) {
        setUser(data.data);
      }
    } catch (error) {
      console.error("Failed to load profile:", error);
    }
  };

  const loadSessions = async () => {
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
    }
  };

  const handlePasswordChange = async () => {
    if (profileData.newPassword !== profileData.confirmPassword) {
      notifyError("New passwords do not match");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          currentPassword: profileData.currentPassword,
          newPassword: profileData.newPassword,
          confirmPassword: profileData.confirmPassword,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setProfileData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
        notifySuccess("Password changed successfully!");
      } else {
        notifyError(data.error || "Failed to change password");
      }
    } catch (error) {
      notifyError("Failed to change password");
    } finally {
      setLoading(false);
    }
  };

  const handleSavePreferences = async () => {
    setLoading(true);
    try {
      // Update theme
      applyThemePreference(preferences.theme);

      // Simulate API call for auto logout preference
      await new Promise((resolve) => setTimeout(resolve, 1000));
      notifySuccess("Preferences saved successfully!");
    } catch (error) {
      notifyError("Failed to save preferences");
    } finally {
      setLoading(false);
    }
  };

  const applyThemePreference = (theme: "light" | "dark" | "system") => {
    localStorage.setItem("theme", theme);

    if (theme === "system") {
      const systemPrefersDark = window.matchMedia(
        "(prefers-color-scheme: dark)"
      ).matches;
      applyTheme(systemPrefersDark);
    } else {
      applyTheme(theme === "dark");
    }
  };

  const applyTheme = (isDark: boolean) => {
    if (isDark) {
      document.documentElement.setAttribute("data-theme", "dark");
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.setAttribute("data-theme", "light");
      document.documentElement.classList.remove("dark");
    }
  };

  const handleRevokeSession = async (sessionId: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/sessions/${sessionId}`, {
        method: "DELETE",
        credentials: "include",
      });

      const data = await response.json();
      if (data.success) {
        setSessions(sessions.filter((s) => s.id !== sessionId));
        notifySuccess("Session revoked successfully");
      } else {
        notifyError(data.error || "Failed to revoke session");
      }
    } catch (error) {
      notifyError("Failed to revoke session");
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeAllOtherSessions = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/sessions", {
        method: "DELETE",
        credentials: "include",
      });

      const data = await response.json();
      if (data.success) {
        setSessions(sessions.filter((s) => s.id === currentSessionId));
        notifySuccess("All other sessions revoked successfully");
      } else {
        notifyError(data.error || "Failed to revoke sessions");
      }
    } catch (error) {
      notifyError("Failed to revoke sessions");
    } finally {
      setLoading(false);
    }
  };

  const openConfirmModal = (
    title: string,
    message: string,
    confirmText: string,
    isDestructive: boolean,
    action: () => void
  ) => {
    setConfirmModal({
      isOpen: true,
      title,
      message,
      confirmText,
      isDestructive,
      action,
    });
  };

  const closeConfirmModal = () => {
    setConfirmModal((prev) => ({ ...prev, isOpen: false }));
  };

  const handleConfirmAction = () => {
    confirmModal.action();
    closeConfirmModal();
  };

  const togglePasswordVisibility = (field: string) => {
    setShowPasswords((prev) => ({
      ...prev,
      [field]: !prev[field as keyof typeof prev],
    }));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getThemeIcon = (theme: string) => {
    switch (theme) {
      case "light":
        return Sun;
      case "dark":
        return Moon;
      default:
        return Laptop;
    }
  };

  const tabs = [
    { id: "profile", label: "Profile", icon: User },
    { id: "security", label: "Security", icon: Shield },
    { id: "preferences", label: "Preferences", icon: Settings },
  ];

  const otherSessions = sessions.filter((s) => s.id !== currentSessionId);

  return (
    <div className="min-h-screen bg-background">
      <div className="p-4 space-y-6 max-w-6xl mx-auto">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-xl sm:text-2xl font-bold">Settings</h1>
          <p className="text-sm text-muted-foreground">
            Manage your account preferences and security settings
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Mobile Tab Navigation */}
          <div className="lg:hidden">
            <div className="flex overflow-x-auto space-x-1 p-1 bg-accent/30 rounded-xl">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 whitespace-nowrap ${
                      activeTab === tab.id
                        ? "bg-primary text-primary-foreground shadow-md"
                        : "text-muted-foreground hover:text-foreground hover:bg-accent"
                    }`}
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Desktop Sidebar Navigation */}
          <div className="hidden lg:block lg:w-64">
            <div className="bg-card border border-border rounded-xl p-4 sticky top-4">
              <nav className="space-y-2">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
                        activeTab === tab.id
                          ? "bg-primary text-primary-foreground shadow-md"
                          : "text-muted-foreground hover:text-foreground hover:bg-accent"
                      }`}
                    >
                      <Icon className="mr-3 h-5 w-5" />
                      {tab.label}
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 space-y-6">
            {activeTab === "profile" && (
              <div className="space-y-6">
                {/* Profile Information */}
                <div className="bg-card border border-border rounded-xl p-4 sm:p-6">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h2 className="text-lg font-semibold">
                        Profile Information
                      </h2>
                      <p className="text-sm text-muted-foreground">
                        View your account information
                      </p>
                    </div>
                    <span className="px-3 py-1 text-xs font-medium bg-destructive/10 text-destructive rounded-full border border-destructive/20">
                      {user.role || ""}
                    </span>
                  </div>

                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Full Name
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            value={user.name}
                            disabled
                            className="w-full px-3 py-2.5 border border-border rounded-lg bg-muted/30 text-muted-foreground cursor-not-allowed"
                          />
                          <Lock className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Contact administrator to change your name
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Email Address
                        </label>
                        <div className="relative">
                          <input
                            type="email"
                            value={user.email}
                            disabled
                            className="w-full px-3 py-2.5 border border-border rounded-lg bg-muted/30 text-muted-foreground cursor-not-allowed"
                          />
                          <Lock className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Contact administrator to change your email
                        </p>
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-sm font-medium mb-2">
                          Phone Number
                        </label>
                        <div className="relative">
                          <input
                            type="tel"
                            value={user.phone}
                            disabled
                            className="w-full px-3 py-2.5 border border-border rounded-lg bg-muted/30 text-muted-foreground cursor-not-allowed"
                          />
                          <Lock className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Contact administrator to change your phone number
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Account Information */}
                <div className="bg-card border border-border rounded-xl p-4 sm:p-6">
                  <div className="mb-4">
                    <h2 className="text-lg font-semibold">
                      Account Information
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      View your account details and activity
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm">
                    <div>
                      <p className="text-muted-foreground font-medium mb-1">
                        Account Created
                      </p>
                      <p>
                        {user.createdAt ? formatDate(user.createdAt) : "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground font-medium mb-1">
                        Last Login
                      </p>
                      <p>
                        {user.lastLogin ? formatDate(user.lastLogin) : "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground font-medium mb-1">
                        Total Sessions
                      </p>
                      <p>{sessions.length} active sessions</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground font-medium mb-1">
                        Account Status
                      </p>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-800">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Active
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "security" && (
              <div className="space-y-6">
                {/* Change Password */}
                <div className="bg-card border border-border rounded-xl p-4 sm:p-6">
                  <div className="mb-6">
                    <h2 className="text-lg font-semibold">Change Password</h2>
                    <p className="text-sm text-muted-foreground">
                      Update your password to keep your account secure
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Current Password
                      </label>
                      <div className="relative">
                        <input
                          type={showPasswords.current ? "text" : "password"}
                          value={profileData.currentPassword}
                          onChange={(e) =>
                            setProfileData((prev) => ({
                              ...prev,
                              currentPassword: e.target.value,
                            }))
                          }
                          className="w-full px-3 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-background transition-all duration-200 pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => togglePasswordVisibility("current")}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {showPasswords.current ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        New Password
                      </label>
                      <div className="relative">
                        <input
                          type={showPasswords.new ? "text" : "password"}
                          value={profileData.newPassword}
                          onChange={(e) =>
                            setProfileData((prev) => ({
                              ...prev,
                              newPassword: e.target.value,
                            }))
                          }
                          className="w-full px-3 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-background transition-all duration-200 pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => togglePasswordVisibility("new")}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {showPasswords.new ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Must be at least 8 characters with uppercase, lowercase,
                        number, and special character
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Confirm New Password
                      </label>
                      <div className="relative">
                        <input
                          type={showPasswords.confirm ? "text" : "password"}
                          value={profileData.confirmPassword}
                          onChange={(e) =>
                            setProfileData((prev) => ({
                              ...prev,
                              confirmPassword: e.target.value,
                            }))
                          }
                          className="w-full px-3 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-background transition-all duration-200 pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => togglePasswordVisibility("confirm")}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {showPasswords.confirm ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="pt-6 mt-6 border-t border-border">
                    <button
                      onClick={() =>
                        openConfirmModal(
                          "Change Password",
                          "Are you sure you want to change your password? You will need to use the new password for future logins.",
                          "Change Password",
                          false,
                          handlePasswordChange
                        )
                      }
                      disabled={
                        loading ||
                        !profileData.currentPassword ||
                        !profileData.newPassword ||
                        !profileData.confirmPassword
                      }
                      className="flex items-center px-5 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
                    >
                      {loading ? (
                        <>
                          <Loading size="sm" variant="spinner" message="" />
                          <span className="ml-2">Updating...</span>
                        </>
                      ) : (
                        <>
                          <Shield className="h-4 w-4 mr-2" />
                          Change Password
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Active Sessions */}
                <div className="bg-card border border-border rounded-xl p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <div>
                      <h2 className="text-lg font-semibold">Active Sessions</h2>
                      <p className="text-sm text-muted-foreground">
                        Monitor and manage your login sessions
                      </p>
                    </div>
                    {otherSessions.length > 0 && (
                      <button
                        onClick={() =>
                          openConfirmModal(
                            "Revoke All Other Sessions",
                            "Are you sure you want to revoke all other sessions? You will be logged out from all other devices.",
                            "Revoke All Others",
                            true,
                            handleRevokeAllOtherSessions
                          )
                        }
                        disabled={loading}
                        className="px-4 py-2 text-sm bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90 transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50"
                      >
                        {loading ? (
                          <>
                            <Loading size="sm" variant="spinner" message="" />
                            <span className="ml-2">Revoking...</span>
                          </>
                        ) : (
                          "Revoke All Others"
                        )}
                      </button>
                    )}
                  </div>

                  <div className="space-y-4">
                    {/* Current Session */}
                    {currentSessionId && (
                      <div>
                        <h3 className="text-sm font-medium mb-3 text-muted-foreground">
                          Current Session
                        </h3>
                        {sessions
                          .filter((s) => s.id === currentSessionId)
                          .map((session) => (
                            <SessionCard
                              key={session.id}
                              session={session}
                              isCurrentSession
                            />
                          ))}
                      </div>
                    )}

                    {/* Other Sessions */}
                    {otherSessions.length > 0 && (
                      <div>
                        <h3 className="text-sm font-medium mb-3 text-muted-foreground">
                          Other Sessions ({otherSessions.length})
                        </h3>
                        <div className="space-y-3">
                          {otherSessions.map((session) => (
                            <SessionCard
                              key={session.id}
                              session={session}
                              onRevoke={(sessionId) =>
                                openConfirmModal(
                                  "Revoke Session",
                                  "Are you sure you want to revoke this session? The device will be logged out immediately.",
                                  "Revoke Session",
                                  true,
                                  () => handleRevokeSession(sessionId)
                                )
                              }
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {sessions.length === 0 && (
                      <div className="text-center py-8">
                        <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">
                          No active sessions found
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "preferences" && (
              <div className="space-y-6">
                {/* Auto Logout Settings */}
                <div className="bg-card border border-border rounded-xl p-4 sm:p-6">
                  <div className="mb-6">
                    <h2 className="text-lg font-semibold">Auto Logout</h2>
                    <p className="text-sm text-muted-foreground">
                      Configure automatic logout settings for your account
                    </p>
                  </div>

                  <div className="space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex-1">
                        <p className="text-sm font-medium">
                          Auto logout after inactivity
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Automatically log out when inactive for the selected
                          duration
                        </p>
                      </div>
                      <select
                        value={preferences.autoLogoutMinutes}
                        onChange={(e) =>
                          setPreferences((prev) => ({
                            ...prev,
                            autoLogoutMinutes: parseInt(e.target.value),
                          }))
                        }
                        className="px-3 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-background transition-all duration-200 min-w-[140px]"
                      >
                        <option value={15}>15 minutes</option>
                        <option value={30}>30 minutes</option>
                        <option value={60}>1 hour</option>
                        <option value={120}>2 hours</option>
                        <option value={240}>4 hours</option>
                        <option value={480}>8 hours</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Theme Settings */}
                <div className="bg-card border border-border rounded-xl p-4 sm:p-6">
                  <div className="mb-6">
                    <h2 className="text-lg font-semibold">Appearance</h2>
                    <p className="text-sm text-muted-foreground">
                      Customize your interface appearance
                    </p>
                  </div>

                  <div className="space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex-1">
                        <p className="text-sm font-medium">Theme</p>
                        <p className="text-sm text-muted-foreground">
                          Choose your preferred color scheme
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <select
                          value={preferences.theme}
                          onChange={(e) =>
                            setPreferences((prev) => ({
                              ...prev,
                              theme: e.target.value as
                                | "light"
                                | "dark"
                                | "system",
                            }))
                          }
                          className="px-3 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-background transition-all duration-200 min-w-[120px]"
                        >
                          {/* <option value="system">System</option> */}
                          <option value="light">Light</option>
                          <option value="dark">Dark</option>
                        </select>
                        <button
                          onClick={toggleTheme}
                          className="p-2.5 border border-border rounded-lg hover:bg-accent transition-all duration-200"
                          title="Toggle Theme"
                        >
                          {darkMode ? (
                            <Sun className="h-4 w-4" />
                          ) : (
                            <Moon className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="bg-muted/30 rounded-lg p-4">
                      <div className="flex items-start">
                        <Clock className="h-5 w-5 text-muted-foreground mr-3 mt-0.5 flex-shrink-0" />
                        <div className="text-sm">
                          <p className="font-medium mb-1">
                            Current Auto Logout Timer
                          </p>
                          <p className="text-muted-foreground">
                            You will be automatically logged out after{" "}
                            {preferences.autoLogoutMinutes} minutes of
                            inactivity.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Save Preferences */}
                <div className="flex justify-end">
                  <button
                    onClick={() =>
                      openConfirmModal(
                        "Save Preferences",
                        "Are you sure you want to save these preference changes? They will take effect immediately.",
                        "Save Preferences",
                        false,
                        handleSavePreferences
                      )
                    }
                    disabled={loading}
                    className="flex items-center px-6 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
                  >
                    {loading ? (
                      <>
                        <Loading size="sm" variant="spinner" message="" />
                        <span className="ml-2">Saving...</span>
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save Preferences
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Confirmation Modal */}
        <ConfirmModal
          isOpen={confirmModal.isOpen}
          onClose={closeConfirmModal}
          onConfirm={handleConfirmAction}
          title={confirmModal.title}
          message={confirmModal.message}
          confirmText={confirmModal.confirmText}
          isDestructive={confirmModal.isDestructive}
          loading={loading}
        />
      </div>
    </div>
  );
}
