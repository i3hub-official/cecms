"use client";

import { useState, useEffect } from "react";
import { Settings, User, Shield, Key, Save, Eye, EyeOff, Download, Copy } from "lucide-react";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("profile");
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState({
    name: "",
    email: "",
    role: "",
  });

  const [profileData, setProfileData] = useState({
    name: "",
    email: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  const [systemSettings, setSystemSettings] = useState({
    sessionTimeout: 24,
    maxSessions: 5,
    apiRateLimit: 1000,
    enableNotifications: true,
    enableAuditLog: true,
  });

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      setProfileData((prev) => ({
        ...prev,
        name: parsedUser.name,
        email: parsedUser.email,
      }));
    }
  }, []);

  const handleProfileSave = async () => {
    setLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      const updatedUser = {
        ...user,
        name: profileData.name,
        email: profileData.email,
      };
      localStorage.setItem("user", JSON.stringify(updatedUser));
      setUser(updatedUser);
      alert("Profile updated successfully!");
    } catch (error) {
      console.error("Failed to update profile:", error);
    } finally {
      setLoading(false);
    }
  };

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
      setProfileData((prev) => ({
        ...prev,
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      }));
      alert("Password changed successfully!");
    } catch (error) {
      console.error("Failed to change password:", error);
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = (field: string) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field as keyof typeof prev]
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
    { id: "api", label: "API", icon: Key },
  ];

  return (
    <div className="p-6 space-y-6 bg-background text-foreground">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account and system preferences
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar Navigation */}
        <div className="bg-card text-card-foreground rounded-2xl shadow-sm border border-border p-4 transition-colors duration-300">
          <nav className="space-y-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    activeTab === tab.id
                      ? "bg-primary/10 text-primary border-r-2 border-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent"
                  }`}
                >
                  <Icon
                    className={`mr-3 h-5 w-5 ${
                      activeTab === tab.id ? "text-primary" : "text-muted-foreground"
                    }`}
                  />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3 space-y-6">
          {activeTab === "profile" && (
            <div className="bg-card text-card-foreground rounded-2xl shadow-sm border border-border p-6 space-y-6 transition-colors duration-300">
              <div>
                <h2 className="text-lg font-medium">Profile Information</h2>
                <p className="text-sm text-muted-foreground">
                  Update your personal information
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={profileData.name}
                    onChange={(e) =>
                      setProfileData((prev) => ({
                        ...prev,
                        name: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-background transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={profileData.email}
                    onChange={(e) =>
                      setProfileData((prev) => ({
                        ...prev,
                        email: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-background transition-colors"
                  />
                </div>
              </div>
              
              <div className="pt-4 border-t border-border">
                <button
                  onClick={handleProfileSave}
                  disabled={loading}
                  className="flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
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
              <div className="bg-card text-card-foreground rounded-2xl shadow-sm border border-border p-6 transition-colors duration-300">
                <div className="mb-6">
                  <h2 className="text-lg font-medium">Change Password</h2>
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
                        className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-background transition-colors pr-10"
                      />
                      <button
                        onClick={() => togglePasswordVisibility("current")}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPasswords.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
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
                        className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-background transition-colors pr-10"
                      />
                      <button
                        onClick={() => togglePasswordVisibility("new")}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPasswords.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
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
                        className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-background transition-colors pr-10"
                      />
                      <button
                        onClick={() => togglePasswordVisibility("confirm")}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPasswords.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                </div>
                
                <div className="pt-6 mt-6 border-t border-border">
                  <button
                    onClick={handlePasswordChange}
                    disabled={loading}
                    className="flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2"></div>
                        Updating...
                      </>
                    ) : (
                      "Change Password"
                    )}
                  </button>
                </div>
              </div>

              <div className="bg-card text-card-foreground rounded-2xl shadow-sm border border-border p-6 transition-colors duration-300">
                <div className="mb-6">
                  <h2 className="text-lg font-medium">Security Settings</h2>
                  <p className="text-sm text-muted-foreground">
                    Configure your security preferences
                  </p>
                </div>
                
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
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
                      className="px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-background transition-colors"
                    >
                      <option value={1}>1 hour</option>
                      <option value={4}>4 hours</option>
                      <option value={8}>8 hours</option>
                      <option value={24}>24 hours</option>
                    </select>
                  </div>
                  
                  <div className="flex items-center justify-between">
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
                      className="px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-background transition-colors"
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
            <div className="bg-card text-card-foreground rounded-2xl shadow-sm border border-border p-6 transition-colors duration-300">
              <div className="mb-6">
                <h2 className="text-lg font-medium">System Configuration</h2>
                <p className="text-sm text-muted-foreground">
                  Manage system-wide settings and preferences
                </p>
              </div>
              
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium">Enable Notifications</p>
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
                    <div className="w-11 h-6 bg-muted-foreground/30 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
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
                    <div className="w-11 h-6 bg-muted-foreground/30 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
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
                    className="px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-background transition-colors"
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
                  className="flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
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
            <div className="bg-card text-card-foreground rounded-2xl shadow-sm border border-border p-6 space-y-6 transition-colors duration-300">
              <div>
                <h2 className="text-lg font-medium">API Configuration</h2>
                <p className="text-sm text-muted-foreground">
                  Manage your API keys and endpoints
                </p>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    API Key
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value="sk_**********************"
                      disabled
                      className="flex-1 px-3 py-2 border border-border rounded-lg bg-muted-foreground/10 text-muted-foreground"
                    />
                    <button 
                      onClick={() => copyToClipboard("sk_**********************")}
                      className="flex items-center px-3 py-2 border border-border rounded-lg hover:bg-accent transition-colors"
                    >
                      <Copy className="h-4 w-4 mr-1" />
                      Copy
                    </button>
                    <button className="flex items-center px-3 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
                      <Key className="h-4 w-4 mr-1" />
                      Regenerate
                    </button>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    Keep your API key secure. Do not share it publicly.
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">
                    API Endpoint
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value="https://api.example.com/v1"
                      disabled
                      className="flex-1 px-3 py-2 border border-border rounded-lg bg-muted-foreground/10 text-muted-foreground"
                    />
                    <button 
                      onClick={() => copyToClipboard("https://api.example.com/v1")}
                      className="flex items-center px-3 py-2 border border-border rounded-lg hover:bg-accent transition-colors"
                    >
                      <Copy className="h-4 w-4 mr-1" />
                      Copy
                    </button>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    Base URL for all API requests
                  </p>
                </div>
              </div>
              
              <div className="pt-4 border-t border-border">
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => alert("API documentation opened")}
                    className="flex items-center px-4 py-2 border border-border rounded-lg hover:bg-accent transition-colors"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    View Documentation
                  </button>
                  <button
                    onClick={() => alert("API settings saved")}
                    className="flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
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
  );
}