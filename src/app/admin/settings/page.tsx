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
} from "lucide-react";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("profile");
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState({
    name: "",
    email: "",
    role: "",
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

  const [systemSettings, setSystemSettings] = useState({
    sessionTimeout: 24,
    maxSessions: 5,
    apiRateLimit: 1000,
    enableNotifications: true,
    enableAuditLog: true,
  });

  useEffect(() => {
    // Simulate loading user data
    setUser({
      name: "John Doe",
      email: "john.doe@example.com",
      role: "Administrator",
    });
  }, []);

  const handlePasswordChange = async () => {
    if (profileData.newPassword !== profileData.confirmPassword) {
      alert("New passwords do not match");
      return;
    }
    if (profileData.newPassword.length < 8) {
      alert("Password must be at least 8 characters long");
      return;
    }

    setLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setProfileData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      alert("Password changed successfully!");
    } catch (error) {
      console.error("Failed to change password:", error);
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = (field: string) => {
    setShowPasswords((prev) => ({
      ...prev,
      [field]: !prev[field as keyof typeof prev],
    }));
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("Copied to clipboard!");
  };

  const tabs = [
    { id: "profile", label: "Profile", icon: User },
    { id: "security", label: "Security", icon: Shield },
    { id: "system", label: "System", icon: Settings },
    { id: "api", label: "API Keys", icon: Key },
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
                    View your account information
                  </p>
                </div>

                {/* Read-only Profile Info */}
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

                {/* Info Card */}
                <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <div className="flex items-start">
                    <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 mr-3 mt-0.5 flex-shrink-0" />
                    <div>
                      <h3 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
                        Account Information
                      </h3>
                      <p className="text-sm text-blue-700 dark:text-blue-200">
                        Your profile information is managed by your
                        administrator. To update your name or email address,
                        please contact your system administrator.
                      </p>
                    </div>
                  </div>
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
                        Must be at least 8 characters long
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
                    <h2 className="text-lg font-semibold">Security Settings</h2>
                    <p className="text-sm text-muted-foreground">
                      Configure your security preferences
                    </p>
                  </div>

                  <div className="space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex-1">
                        <p className="text-sm font-medium">Session Timeout</p>
                        <p className="text-sm text-muted-foreground">
                          Automatically log out after inactivity
                        </p>
                      </div>
                      <select
                        value={systemSettings.sessionTimeout}
                        onChange={(e) =>
                          setSystemSettings((prev) => ({
                            ...prev,
                            sessionTimeout: parseInt(e.target.value),
                          }))
                        }
                        className="px-3 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-background transition-all duration-200 min-w-[140px]"
                      >
                        <option value={1}>1 hour</option>
                        <option value={4}>4 hours</option>
                        <option value={8}>8 hours</option>
                        <option value={24}>24 hours</option>
                      </select>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex-1">
                        <p className="text-sm font-medium">Maximum Sessions</p>
                        <p className="text-sm text-muted-foreground">
                          Limit concurrent sessions per user
                        </p>
                      </div>
                      <select
                        value={systemSettings.maxSessions}
                        onChange={(e) =>
                          setSystemSettings((prev) => ({
                            ...prev,
                            maxSessions: parseInt(e.target.value),
                          }))
                        }
                        className="px-3 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-background transition-all duration-200 min-w-[140px]"
                      >
                        <option value={1}>1 session</option>
                        <option value={3}>3 sessions</option>
                        <option value={5}>5 sessions</option>
                        <option value={10}>10 sessions</option>
                      </select>
                    </div>
                  </div>
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
                      <p className="text-sm font-medium">API Rate Limit</p>
                      <p className="text-sm text-muted-foreground">
                        Maximum API requests per minute
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
                    onClick={() => {
                      setLoading(true);
                      setTimeout(() => {
                        setLoading(false);
                        alert("System settings saved successfully!");
                      }, 1000);
                    }}
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
              <div className="bg-card border border-border rounded-xl p-4 sm:p-6 space-y-6">
                <div>
                  <h2 className="text-lg font-semibold">API Configuration</h2>
                  <p className="text-sm text-muted-foreground">
                    Manage your API keys and endpoints
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      API Key
                    </label>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="text"
                        value="sk_**********************"
                        disabled
                        className="flex-1 px-3 py-2.5 border border-border rounded-lg bg-muted/30 text-muted-foreground cursor-not-allowed"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() =>
                            copyToClipboard("sk_**********************")
                          }
                          className="flex items-center px-4 py-2.5 border border-border rounded-lg hover:bg-accent transition-all duration-200 shadow-sm hover:shadow-md"
                        >
                          <Copy className="h-4 w-4 mr-2" />
                          Copy
                        </button>
                        <button className="flex items-center px-4 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all duration-200 shadow-md hover:shadow-lg">
                          <Key className="h-4 w-4 mr-2" />
                          Regenerate
                        </button>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">
                      Keep your API key secure. Do not share it publicly.
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      API Endpoint
                    </label>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="text"
                        value="https://api.example.com/v1"
                        disabled
                        className="flex-1 px-3 py-2.5 border border-border rounded-lg bg-muted/30 text-muted-foreground cursor-not-allowed"
                      />
                      <button
                        onClick={() =>
                          copyToClipboard("https://api.example.com/v1")
                        }
                        className="flex items-center px-4 py-2.5 border border-border rounded-lg hover:bg-accent transition-all duration-200 shadow-sm hover:shadow-md"
                      >
                        <Copy className="h-4 w-4 mr-2" />
                        Copy
                      </button>
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">
                      Base URL for all API requests
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t border-border">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={() => alert("API documentation opened")}
                      className="flex items-center justify-center px-5 py-2.5 border border-border rounded-lg hover:bg-accent transition-all duration-200 shadow-sm hover:shadow-md"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      View Documentation
                    </button>
                    <button
                      onClick={() => alert("API settings saved")}
                      className="flex items-center justify-center px-5 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all duration-200 shadow-md hover:shadow-lg"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Save API Settings
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
