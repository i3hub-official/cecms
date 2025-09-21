"use client";

import { useState, useEffect } from "react";
import {
  Settings,
  User,
  Shield,
  Key,
  Save,
  Eye,
  EyeOff,
  Download,
  Copy,
  Lock,
  Info,
  Plus,
  Trash2,
  XCircle,
  RefreshCw,
  Activity,
  Clock,
} from "lucide-react";

interface ApiKey {
  id: string;
  prefix: string;
  name: string;
  description?: string;
  canRead: boolean;
  canWrite: boolean;
  canDelete: boolean;
  canManageKeys: boolean;
  allowedEndpoints: string;
  rateLimit: number;
  rateLimitPeriod: number;
  isActive: boolean;
  expiresAt?: string;
  revokedAt?: string;
  createdAt: string;
  lastUsed?: string;
  usageCount: number;
  recentUsage?: any[];
}

interface AuditLog {
  id: string;
  action: string;
  entity: string;
  entityId: string;
  details?: string;
  timestamp: string;
  adminName: string;
  adminEmail: string;
}

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
  const [user, setUser] = useState({
    name: "",
    email: "",
    phone: "",
    role: "",
  });

  const [profileData, setProfileData] = useState({
    phone: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const [systemSettings, setSystemSettings] = useState({
    sessionTimeout: 24,
    maxSessions: 5,
    apiRateLimit: 1000,
    enableNotifications: true,
    enableAuditLog: true,
  });

  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [showCreateApiKey, setShowCreateApiKey] = useState(false);
  const [newApiKeyData, setNewApiKeyData] = useState({
    name: "",
    description: "",
    canRead: true,
    canWrite: false,
    canDelete: false,
    canManageKeys: false,
    allowedEndpoints: "*",
    rateLimit: 100,
    rateLimitPeriod: 60,
    expiresAt: "",
  });
  const [createdApiKey, setCreatedApiKey] = useState<string | null>(null);

  // Load initial data
  useEffect(() => {
    loadProfileData();
    loadSystemSettings();
    if (activeTab === "api") {
      loadApiKeys();
    }
    if (activeTab === "security") {
      loadSessions();
    }
    if (activeTab === "audit") {
      loadAuditLogs();
    }
  }, [activeTab]);

  const loadProfileData = async () => {
    try {
      const response = await fetch("/api/admin/profile", {
        credentials: "include",
      });
      const data = await response.json();
      if (data.success) {
        setUser(data.data);
        setProfileData((prev) => ({ ...prev, phone: data.data.phone }));
      }
    } catch (error) {
      console.error("Failed to load profile:", error);
    }
  };

  const loadSystemSettings = async () => {
    try {
      const response = await fetch("/api/admin/settings", {
        credentials: "include",
      });
      const data = await response.json();
      if (data.success) {
        setSystemSettings(data.data);
      }
    } catch (error) {
      console.error("Failed to load settings:", error);
    }
  };

  const loadApiKeys = async () => {
    try {
      const response = await fetch("/api/admin/api/keys", {
        credentials: "include",
      });
      const data = await response.json();
      if (data.success) {
        setApiKeys(data.data);
      }
    } catch (error) {
      console.error("Failed to load API keys:", error);
    }
  };

  const loadSessions = async () => {
    try {
      const response = await fetch("/api/admin/sessions", {
        credentials: "include",
      });
      const data = await response.json();
      if (data.success) {
        setSessions(data.data);
      }
    } catch (error) {
      console.error("Failed to load sessions:", error);
    }
  };

  const loadAuditLogs = async () => {
    try {
      const response = await fetch("/api/admin/audit-logs?limit=50", {
        credentials: "include",
      });
      const data = await response.json();
      if (data.success) {
        setAuditLogs(data.data);
      }
    } catch (error) {
      console.error("Failed to load audit logs:", error);
    }
  };

  const handlePasswordChange = async () => {
    if (profileData.newPassword !== profileData.confirmPassword) {
      alert("New passwords do not match");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/admin/change-password", {
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
        setProfileData((prev) => ({
          ...prev,
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        }));
        alert("Password changed successfully!");
      } else {
        alert(data.error || "Failed to change password");
      }
    } catch (error) {
      alert("Failed to change password");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ phone: profileData.phone }),
      });

      const data = await response.json();
      if (data.success) {
        setUser((prev) => ({ ...prev, phone: data.data.phone }));
        alert("Profile updated successfully!");
      } else {
        alert(data.error || "Failed to update profile");
      }
    } catch (error) {
      alert("Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSystemSettings = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(systemSettings),
      });

      const data = await response.json();
      if (data.success) {
        alert("System settings saved successfully!");
      } else {
        alert(data.error || "Failed to save settings");
      }
    } catch (error) {
      alert("Failed to save settings");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateApiKey = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/api/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(newApiKeyData),
      });

      const data = await response.json();
      if (data.success) {
        setCreatedApiKey(data.data.key);
        setShowCreateApiKey(false);
        setNewApiKeyData({
          name: "",
          description: "",
          canRead: true,
          canWrite: false,
          canDelete: false,
          canManageKeys: false,
          allowedEndpoints: "*",
          rateLimit: 100,
          rateLimitPeriod: 60,
          expiresAt: "",
        });
        loadApiKeys();
      } else {
        alert(data.error || "Failed to create API key");
      }
    } catch (error) {
      alert("Failed to create API key");
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerateApiKey = async (keyId: string) => {
    if (
      !confirm(
        "Are you sure you want to regenerate this API key? The old key will stop working immediately."
      )
    ) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/api/keys/${keyId}/regenerate`, {
        method: "POST",
        credentials: "include",
      });

      const data = await response.json();
      if (data.success) {
        setCreatedApiKey(data.data.key);
        loadApiKeys();
      } else {
        alert(data.error || "Failed to regenerate API key");
      }
    } catch (error) {
      alert("Failed to regenerate API key");
    }
  };

  const handleDeleteApiKey = async (keyId: string) => {
    if (
      !confirm(
        "Are you sure you want to revoke this API key? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/api/keys/${keyId}`, {
        method: "DELETE",
        credentials: "include",
      });

      const data = await response.json();
      if (data.success) {
        loadApiKeys();
        alert("API key revoked successfully");
      } else {
        alert(data.error || "Failed to revoke API key");
      }
    } catch (error) {
      alert("Failed to revoke API key");
    }
  };

  const togglePasswordVisibility = (field: string) => {
    setShowPasswords((prev) => ({
      ...prev,
      [field]: !prev[field as keyof typeof prev],
    }));
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      alert("Copied to clipboard!");
    } catch (error) {
      alert("Failed to copy to clipboard");
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const tabs = [
    { id: "profile", label: "Profile", icon: User },
    { id: "security", label: "Security", icon: Shield },
    { id: "system", label: "System", icon: Settings },
    { id: "api", label: "API Keys", icon: Key },
    { id: "audit", label: "Audit Logs", icon: Activity },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="p-4 space-y-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-xl sm:text-2xl font-bold">Settings</h1>
          <p className="text-sm text-muted-foreground">
            Manage your account and system preferences
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
              <div className="bg-card border border-border rounded-xl p-4 sm:p-6 space-y-6">
                <div>
                  <h2 className="text-lg font-semibold">Profile Information</h2>
                  <p className="text-sm text-muted-foreground">
                    View and update your account information
                  </p>
                </div>

                <div className="space-y-4">
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

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={profileData.phone}
                      onChange={(e) =>
                        setProfileData((prev) => ({
                          ...prev,
                          phone: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-background transition-all duration-200"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Role
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={user.role}
                        disabled
                        className="w-full px-3 py-2.5 border border-border rounded-lg bg-muted/30 text-muted-foreground cursor-not-allowed"
                      />
                      <Lock className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-border">
                  <button
                    onClick={handleUpdateProfile}
                    disabled={loading}
                    className="flex items-center px-5 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2"></div>
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save Changes
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {activeTab === "security" && (
              <div className="space-y-6">
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
                      onClick={handlePasswordChange}
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
                          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2"></div>
                          Updating...
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

                <div className="bg-card border border-border rounded-xl p-4 sm:p-6">
                  <div className="mb-6">
                    <h2 className="text-lg font-semibold">Active Sessions</h2>
                    <p className="text-sm text-muted-foreground">
                      Monitor your active login sessions
                    </p>
                  </div>

                  {sessions.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">
                      No active sessions found
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {sessions.map((session) => (
                        <div
                          key={session.id}
                          className="flex items-center justify-between p-3 border border-border rounded-lg"
                        >
                          <div className="flex items-center space-x-3">
                            <Shield className="h-5 w-5 text-primary" />
                            <div>
                              <p className="font-medium">
                                {session.deviceInfo || "Unknown device"}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {session.location || session.ipAddress} • Last
                                used {formatDate(session.lastUsed)}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-muted-foreground">
                              Expires {formatDate(session.expiresAt)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === "system" && (
              <div className="bg-card border border-border rounded-xl p-4 sm:p-6">
                <div className="mb-6">
                  <h2 className="text-lg font-semibold">
                    System Configuration
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Manage system-wide settings and preferences
                  </p>
                </div>

                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex-1">
                      <p className="text-sm font-medium">
                        Enable Notifications
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Receive system notifications
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={systemSettings.enableNotifications}
                        onChange={(e) =>
                          setSystemSettings((prev) => ({
                            ...prev,
                            enableNotifications: e.target.checked,
                          }))
                        }
                        className="sr-only peer"
                      />
                      <div className="w-12 h-6 bg-muted peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-6 peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary shadow-md"></div>
                    </label>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex-1">
                      <p className="text-sm font-medium">Enable Audit Log</p>
                      <p className="text-sm text-muted-foreground">
                        Record system activities and changes
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={systemSettings.enableAuditLog}
                        onChange={(e) =>
                          setSystemSettings((prev) => ({
                            ...prev,
                            enableAuditLog: e.target.checked,
                          }))
                        }
                        className="sr-only peer"
                      />
                      <div className="w-12 h-6 bg-muted peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-6 peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary shadow-md"></div>
                    </label>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex-1">
                      <p className="text-sm font-medium">Session Timeout</p>
                      <p className="text-sm text-muted-foreground">
                        Automatically log out after inactivity
                      </p>
                    </div>
                    <select
                      value={systemSettings.apiRateLimit}
                      onChange={(e) =>
                        setSystemSettings((prev) => ({
                          ...prev,
                          apiRateLimit: parseInt(e.target.value),
                        }))
                      }
                      className="px-3 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-background transition-all duration-200 min-w-[140px]"
                    >
                      <option value={100}>100 requests</option>
                      <option value={500}>500 requests</option>
                      <option value={1000}>1000 requests</option>
                      <option value={5000}>5000 requests</option>
                    </select>
                  </div>
                </div>

                <div className="pt-6 mt-6 border-t border-border">
                  <button
                    onClick={handleSaveSystemSettings}
                    disabled={loading}
                    className="flex items-center px-5 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2"></div>
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save System Settings
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {activeTab === "api" && (
              <div className="space-y-6">
                {/* API Key Creation Success Modal */}
                {createdApiKey && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-background border border-border rounded-2xl max-w-md w-full mx-4 shadow-2xl">
                      <div className="p-6">
                        <h3 className="text-lg font-semibold mb-4">
                          API Key Created Successfully!
                        </h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          Copy this API key now. You won&apos;t be able to see
                          it again for security reasons.
                        </p>
                        <div className="bg-muted/30 p-3 rounded-lg mb-4">
                          <code className="text-sm break-all">
                            {createdApiKey}
                          </code>
                        </div>
                        <div className="flex gap-3">
                          <button
                            onClick={() => copyToClipboard(createdApiKey)}
                            className="flex-1 flex items-center justify-center px-4 py-2 border border-border rounded-lg hover:bg-accent transition-all duration-200"
                          >
                            <Copy className="h-4 w-4 mr-2" />
                            Copy Key
                          </button>
                          <button
                            onClick={() => setCreatedApiKey(null)}
                            className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all duration-200"
                          >
                            Done
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Create API Key Modal */}
                {showCreateApiKey && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-background border border-border rounded-2xl max-w-2xl w-full mx-4 shadow-2xl max-h-[90vh] overflow-y-auto">
                      <div className="p-6">
                        <div className="flex items-center justify-between mb-6">
                          <h3 className="text-lg font-semibold">
                            Create New API Key
                          </h3>
                          <button
                            onClick={() => setShowCreateApiKey(false)}
                            className="p-2 hover:bg-accent rounded-full transition-colors"
                          >
                            <XCircle className="h-5 w-5" />
                          </button>
                        </div>

                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium mb-2">
                              Name *
                            </label>
                            <input
                              type="text"
                              value={newApiKeyData.name}
                              onChange={(e) =>
                                setNewApiKeyData((prev) => ({
                                  ...prev,
                                  name: e.target.value,
                                }))
                              }
                              className="w-full px-3 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                              placeholder="e.g., Production API Key"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium mb-2">
                              Description
                            </label>
                            <textarea
                              value={newApiKeyData.description}
                              onChange={(e) =>
                                setNewApiKeyData((prev) => ({
                                  ...prev,
                                  description: e.target.value,
                                }))
                              }
                              className="w-full px-3 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                              placeholder="Optional description..."
                              rows={3}
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium mb-2">
                              Permissions
                            </label>
                            <div className="space-y-2">
                              <label className="flex items-center">
                                <input
                                  type="checkbox"
                                  checked={newApiKeyData.canRead}
                                  onChange={(e) =>
                                    setNewApiKeyData((prev) => ({
                                      ...prev,
                                      canRead: e.target.checked,
                                    }))
                                  }
                                  className="mr-2"
                                />
                                <span className="text-sm">Read access</span>
                              </label>
                              <label className="flex items-center">
                                <input
                                  type="checkbox"
                                  checked={newApiKeyData.canWrite}
                                  onChange={(e) =>
                                    setNewApiKeyData((prev) => ({
                                      ...prev,
                                      canWrite: e.target.checked,
                                    }))
                                  }
                                  className="mr-2"
                                />
                                <span className="text-sm">Write access</span>
                              </label>
                              <label className="flex items-center">
                                <input
                                  type="checkbox"
                                  checked={newApiKeyData.canDelete}
                                  onChange={(e) =>
                                    setNewApiKeyData((prev) => ({
                                      ...prev,
                                      canDelete: e.target.checked,
                                    }))
                                  }
                                  className="mr-2"
                                />
                                <span className="text-sm">Delete access</span>
                              </label>
                              <label className="flex items-center">
                                <input
                                  type="checkbox"
                                  checked={newApiKeyData.canManageKeys}
                                  onChange={(e) =>
                                    setNewApiKeyData((prev) => ({
                                      ...prev,
                                      canManageKeys: e.target.checked,
                                    }))
                                  }
                                  className="mr-2"
                                />
                                <span className="text-sm">Manage API keys</span>
                              </label>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium mb-2">
                                Rate Limit
                              </label>
                              <input
                                type="number"
                                value={newApiKeyData.rateLimit}
                                onChange={(e) =>
                                  setNewApiKeyData((prev) => ({
                                    ...prev,
                                    rateLimit: parseInt(e.target.value) || 100,
                                  }))
                                }
                                className="w-full px-3 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                                min="1"
                                max="10000"
                              />
                              <p className="text-xs text-muted-foreground mt-1">
                                requests per minute
                              </p>
                            </div>

                            <div>
                              <label className="block text-sm font-medium mb-2">
                                Expiration
                              </label>
                              <input
                                type="datetime-local"
                                value={newApiKeyData.expiresAt}
                                onChange={(e) =>
                                  setNewApiKeyData((prev) => ({
                                    ...prev,
                                    expiresAt: e.target.value,
                                  }))
                                }
                                className="w-full px-3 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                              />
                              <p className="text-xs text-muted-foreground mt-1">
                                optional
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                          <button
                            onClick={() => setShowCreateApiKey(false)}
                            className="flex-1 px-4 py-2 border border-border rounded-lg hover:bg-accent transition-all duration-200"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={handleCreateApiKey}
                            disabled={loading || !newApiKeyData.name}
                            className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all duration-200 disabled:opacity-50"
                          >
                            {loading ? "Creating..." : "Create API Key"}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* API Keys List */}
                <div className="bg-card border border-border rounded-xl p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <div>
                      <h2 className="text-lg font-semibold">API Keys</h2>
                      <p className="text-sm text-muted-foreground">
                        Manage your API keys for accessing the system
                      </p>
                    </div>
                    <button
                      onClick={() => setShowCreateApiKey(true)}
                      className="flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all duration-200 shadow-md hover:shadow-lg"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Create API Key
                    </button>
                  </div>

                  {apiKeys.length === 0 ? (
                    <div className="text-center py-12">
                      <Key className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No API keys found</p>
                      <p className="text-sm text-muted-foreground mt-2">
                        Create your first API key to get started
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {apiKeys.map((apiKey) => (
                        <div
                          key={apiKey.id}
                          className="border border-border rounded-lg p-4"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h3 className="font-medium">{apiKey.name}</h3>
                                <span
                                  className={`px-2 py-0.5 text-xs rounded-full ${
                                    apiKey.isActive && !apiKey.revokedAt
                                      ? "bg-green-100 text-green-800"
                                      : "bg-red-100 text-red-800"
                                  }`}
                                >
                                  {apiKey.isActive && !apiKey.revokedAt
                                    ? "Active"
                                    : "Revoked"}
                                </span>
                              </div>

                              <div className="space-y-1">
                                <p className="text-sm text-muted-foreground">
                                  Key: {apiKey.prefix}••••••••••••••••••••
                                </p>
                                {apiKey.description && (
                                  <p className="text-sm text-muted-foreground">
                                    {apiKey.description}
                                  </p>
                                )}
                                <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                                  <span>
                                    Created: {formatDate(apiKey.createdAt)}
                                  </span>
                                  <span>
                                    Usage: {apiKey.usageCount} requests
                                  </span>
                                  {apiKey.lastUsed && (
                                    <span>
                                      Last used: {formatDate(apiKey.lastUsed)}
                                    </span>
                                  )}
                                  {apiKey.expiresAt && (
                                    <span>
                                      Expires: {formatDate(apiKey.expiresAt)}
                                    </span>
                                  )}
                                </div>

                                <div className="flex gap-2 text-xs mt-2">
                                  {apiKey.canRead && (
                                    <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                                      Read
                                    </span>
                                  )}
                                  {apiKey.canWrite && (
                                    <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded">
                                      Write
                                    </span>
                                  )}
                                  {apiKey.canDelete && (
                                    <span className="bg-red-100 text-red-800 px-2 py-0.5 rounded">
                                      Delete
                                    </span>
                                  )}
                                  {apiKey.canManageKeys && (
                                    <span className="bg-purple-100 text-purple-800 px-2 py-0.5 rounded">
                                      Manage Keys
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="flex gap-2">
                              <button
                                onClick={() =>
                                  handleRegenerateApiKey(apiKey.id)
                                }
                                className="flex items-center px-3 py-1.5 text-sm border border-border rounded-lg hover:bg-accent transition-all duration-200"
                              >
                                <RefreshCw className="h-4 w-4 mr-1" />
                                Regenerate
                              </button>
                              <button
                                onClick={() => handleDeleteApiKey(apiKey.id)}
                                className="flex items-center px-3 py-1.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all duration-200"
                              >
                                <Trash2 className="h-4 w-4 mr-1" />
                                Revoke
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === "audit" && (
              <div className="bg-card border border-border rounded-xl p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  <div>
                    <h2 className="text-lg font-semibold">Audit Logs</h2>
                    <p className="text-sm text-muted-foreground">
                      View system activity and changes
                    </p>
                  </div>
                  <button
                    onClick={loadAuditLogs}
                    className="flex items-center px-4 py-2 border border-border rounded-lg hover:bg-accent transition-all duration-200"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </button>
                </div>

                {auditLogs.length === 0 ? (
                  <div className="text-center py-12">
                    <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No audit logs found</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {auditLogs.map((log) => (
                      <div
                        key={log.id}
                        className="border border-border rounded-lg p-4 hover:bg-accent/30 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span
                                className={`px-2 py-0.5 text-xs rounded-full font-medium ${
                                  log.action === "CREATE"
                                    ? "bg-green-100 text-green-800"
                                    : log.action === "UPDATE"
                                    ? "bg-blue-100 text-blue-800"
                                    : log.action === "DELETE"
                                    ? "bg-red-100 text-red-800"
                                    : "bg-gray-100 text-gray-800"
                                }`}
                              >
                                {log.action}
                              </span>
                              <span className="text-sm font-medium">
                                {log.entity}
                              </span>
                              <span className="text-sm text-muted-foreground">
                                #{log.entityId.substring(0, 8)}
                              </span>
                            </div>

                            <div className="text-sm text-muted-foreground space-y-1">
                              <p>
                                <Clock className="h-3 w-3 inline mr-1" />
                                {formatDate(log.timestamp)}
                              </p>
                              <p>
                                <User className="h-3 w-3 inline mr-1" />
                                {log.adminName} ({log.adminEmail})
                              </p>
                              {log.details && (
                                <p className="mt-2 text-sm bg-muted/30 p-2 rounded">
                                  {log.details}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
