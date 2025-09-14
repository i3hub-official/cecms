"use client";

import { useState, useEffect } from "react";
import { Settings, User, Shield, Key, Save } from "lucide-react";

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

  const tabs = [
    { id: "profile", label: "Profile", icon: User },
    { id: "security", label: "Security", icon: Shield },
    { id: "system", label: "System", icon: Settings },
    { id: "api", label: "API", icon: Key },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600">
          Manage your account and system preferences
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar Navigation */}
        <div className="card p-4">
          <nav className="space-y-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    activeTab === tab.id
                      ? "bg-blue-50 text-blue-700 border-r-2 border-blue-600"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  }`}
                >
                  <Icon
                    className={`mr-3 h-5 w-5 ${
                      activeTab === tab.id ? "text-blue-600" : "text-gray-400"
                    }`}
                  />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          {activeTab === "profile" && (
            <div className="card p-6 space-y-6">
              <h2 className="text-lg font-medium text-gray-900">
                Profile Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
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
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
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
                    className="input"
                  />
                </div>
              </div>
              <div className="pt-4 border-t">
                <button
                  onClick={handleProfileSave}
                  disabled={loading}
                  className="btn btn-primary"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full spinner mr-2"></div>
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
              <div className="card p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">
                  Change Password
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Current Password
                    </label>
                    <input
                      type="password"
                      value={profileData.currentPassword}
                      onChange={(e) =>
                        setProfileData((prev) => ({
                          ...prev,
                          currentPassword: e.target.value,
                        }))
                      }
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      New Password
                    </label>
                    <input
                      type="password"
                      value={profileData.newPassword}
                      onChange={(e) =>
                        setProfileData((prev) => ({
                          ...prev,
                          newPassword: e.target.value,
                        }))
                      }
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      value={profileData.confirmPassword}
                      onChange={(e) =>
                        setProfileData((prev) => ({
                          ...prev,
                          confirmPassword: e.target.value,
                        }))
                      }
                      className="input"
                    />
                  </div>
                </div>
                <div className="pt-4">
                  <button
                    onClick={handlePasswordChange}
                    disabled={loading}
                    className="btn btn-primary"
                  >
                    Change Password
                  </button>
                </div>
              </div>

              <div className="card p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">
                  Security Settings
                </h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        Session Timeout
                      </p>
                      <p className="text-sm text-gray-500">
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
                      className="input w-32"
                    >
                      <option value={1}>1 hour</option>
                      <option value={4}>4 hours</option>
                      <option value={8}>8 hours</option>
                      <option value={24}>24 hours</option>
                    </select>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        Maximum Sessions
                      </p>
                      <p className="text-sm text-gray-500">
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
                      className="input w-32"
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
            <div className="card p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">
                System Configuration
              </h2>
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Enable Notifications
                    </p>
                    <p className="text-sm text-gray-500">
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
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Enable Audit Log
                    </p>
                    <p className="text-sm text-gray-500">
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
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      API Rate Limit
                    </p>
                    <p className="text-sm text-gray-500">
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
                    className="input w-32"
                  >
                    <option value={100}>100 requests</option>
                    <option value={500}>500 requests</option>
                    <option value={1000}>1000 requests</option>
                    <option value={5000}>5000 requests</option>
                  </select>
                </div>
              </div>

              <div className="pt-6 mt-6 border-t">
                <button
                  onClick={() => {
                    setLoading(true);
                    setTimeout(() => {
                      setLoading(false);
                      alert("System settings saved successfully!");
                    }, 1000);
                  }}
                  disabled={loading}
                  className="btn btn-primary"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full spinner mr-2"></div>
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
            <div className="card p-6 space-y-6">
              <h2 className="text-lg font-medium text-gray-900">
                API Configuration
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    API Key
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value="sk_**********************"
                      disabled
                      className="input flex-1"
                    />
                    <button className="btn btn-secondary">
                      <Key className="h-4 w-4 mr-2" />
                      Regenerate
                    </button>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    Keep your API key secure. Do not share it publicly.
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    API Endpoint
                  </label>
                  <input
                    type="text"
                    value="https://api.example.com/v1"
                    disabled
                    className="input"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Base URL for all API requests
                  </p>
                </div>
              </div>
              <div className="pt-4 border-t">
                <button
                  onClick={() => alert("API documentation opened")}
                  className="btn btn-secondary mr-3"
                >
                  View Documentation
                </button>
                <button
                  onClick={() => alert("API settings saved")}
                  className="btn btn-primary"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save API Settings
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
