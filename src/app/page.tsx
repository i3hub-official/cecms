"use client";
import React, { useState } from "react";
import {
  Settings,
  Users,
  Shield,
  BarChart3,
  Database,
  School,
  ChevronRight,
  CheckCircle,
  Menu,
  X,
  Activity,
  UserCheck,
  Bell,
  Plus,
  TrendingUp,
} from "lucide-react";

export default function CECMSAdminPortal() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const adminFeatures = [
    {
      icon: School,
      title: "School Management",
      description:
        "Add, remove, update, and retrieve school information. Manage school profiles, contact details, and institutional data across your diocese.",
      actions: [
        "Create Schools",
        "Edit Details",
        "Deactivate/Activate",
        "Bulk Operations",
      ],
    },
    {
      icon: Users,
      title: "User Administration",
      description:
        "Comprehensive user management for principals, teachers, staff, and system administrators with role-based access control.",
      actions: [
        "User Creation",
        "Role Assignment",
        "Access Control",
        "Bulk Import",
      ],
    },
    {
      icon: Shield,
      title: "Session Management",
      description:
        "Monitor and manage administrator sessions, security protocols, and system access across all connected schools.",
      actions: [
        "Active Sessions",
        "Security Logs",
        "Force Logout",
        "Access Reports",
      ],
    },
    {
      icon: BarChart3,
      title: "Analytics Dashboard",
      description:
        "Real-time insights into system usage, school performance metrics, and administrative efficiency across your network.",
      actions: [
        "Performance Metrics",
        "Usage Statistics",
        "Custom Reports",
        "Data Export",
      ],
    },
    {
      icon: Database,
      title: "Data Management",
      description:
        "Centralized database operations, backup management, and data integrity monitoring for all diocesan schools.",
      actions: [
        "Data Backup",
        "System Maintenance",
        "Data Migration",
        "Archive Management",
      ],
    },
    {
      icon: Activity,
      title: "System Monitoring",
      description:
        "Real-time system health monitoring, performance tracking, and automated alerts for critical system events.",
      actions: [
        "Health Checks",
        "Performance Alerts",
        "System Logs",
        "Uptime Monitoring",
      ],
    },
  ];

  const quickStats = [
    { label: "Active Schools", value: "247", icon: School, color: "blue" },
    { label: "Total Users", value: "12,458", icon: Users, color: "green" },
    {
      label: "Active Sessions",
      value: "1,834",
      icon: UserCheck,
      color: "purple",
    },
    {
      label: "System Uptime",
      value: "99.8%",
      icon: TrendingUp,
      color: "indigo",
    },
  ];

  const recentActivities = [
    "St. Mary's Catholic School - Profile Updated",
    "New administrator added to Sacred Heart High School",
    "System backup completed successfully",
    "Security scan completed - No issues found",
    "Holy Cross Elementary - User permissions updated",
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <div className="h-10 w-10 bg-gradient-to-br from-indigo-600 to-blue-600 rounded-lg flex items-center justify-center">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  CECMS Admin Portal
                </h1>
                <p className="text-sm text-gray-600">
                  Catholic Education Commission Management
                </p>
              </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-6">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                <span>System Online</span>
              </div>
              <button className="flex items-center space-x-2 text-gray-600 hover:text-gray-900">
                <Bell className="h-5 w-5" />
                <span className="bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  3
                </span>
              </button>
            </nav>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2"
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-indigo-600 to-blue-600 rounded-2xl p-8 mb-8 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">
                Welcome to CECMS Admin Portal
              </h1>
              <p className="text-indigo-100 text-lg">
                Centralized management for all Catholic schools in your diocese
              </p>
            </div>
            <div className="hidden lg:block">
              <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4">
                <Activity className="h-12 w-12 text-white/80" />
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {quickStats.map((stat, index) => (
            <div
              key={index}
              className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between mb-4">
                <div
                  className={`h-10 w-10 bg-${stat.color}-100 rounded-lg flex items-center justify-center`}
                >
                  <stat.icon className={`h-6 w-6 text-${stat.color}-600`} />
                </div>
                <TrendingUp className="h-4 w-4 text-green-500" />
              </div>
              <div className="text-2xl font-bold text-gray-900 mb-1">
                {stat.value}
              </div>
              <div className="text-sm text-gray-600">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Main Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Administrative Functions */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">
                Administrative Functions
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {adminFeatures.map((feature, index) => (
                  <div
                    key={index}
                    className="border border-gray-200 rounded-xl p-6 hover:shadow-md transition-all hover:border-indigo-200 group"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="h-12 w-12 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                        <feature.icon className="h-6 w-6 text-white" />
                      </div>
                      <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-indigo-600 transition-colors" />
                    </div>

                    <h3 className="font-semibold text-gray-900 mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-gray-600 mb-4">
                      {feature.description}
                    </p>

                    <div className="space-y-1">
                      {feature.actions
                        .slice(0, 2)
                        .map((action, actionIndex) => (
                          <div
                            key={actionIndex}
                            className="flex items-center space-x-2 text-xs text-gray-500"
                          >
                            <CheckCircle className="h-3 w-3" />
                            <span>{action}</span>
                          </div>
                        ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Actions & Recent Activity */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">
                Quick Actions
              </h3>
              <div className="space-y-3">
                <button className="w-full flex items-center space-x-3 p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <Plus className="h-5 w-5 text-green-600" />
                  <span className="text-sm font-medium">Add New School</span>
                </button>
                <button className="w-full flex items-center space-x-3 p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <Users className="h-5 w-5 text-blue-600" />
                  <span className="text-sm font-medium">Manage Users</span>
                </button>
                <button className="w-full flex items-center space-x-3 p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <BarChart3 className="h-5 w-5 text-purple-600" />
                  <span className="text-sm font-medium">View Analytics</span>
                </button>
                <button className="w-full flex items-center space-x-3 p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <Settings className="h-5 w-5 text-gray-600" />
                  <span className="text-sm font-medium">System Settings</span>
                </button>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">
                Recent Activity
              </h3>
              <div className="space-y-3">
                {recentActivities.map((activity, index) => (
                  <div
                    key={index}
                    className="flex items-start space-x-3 text-sm"
                  >
                    <div className="h-2 w-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                    <span className="text-gray-600">{activity}</span>
                  </div>
                ))}
              </div>
              <button className="w-full mt-4 text-sm text-indigo-600 hover:text-indigo-700 font-medium">
                View All Activity →
              </button>
            </div>

            {/* System Status */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">
                System Status
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Database</span>
                  <div className="flex items-center space-x-2">
                    <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-green-600">Online</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">API Services</span>
                  <div className="flex items-center space-x-2">
                    <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-green-600">Online</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Backup Status</span>
                  <div className="flex items-center space-x-2">
                    <div className="h-2 w-2 bg-yellow-500 rounded-full"></div>
                    <span className="text-sm text-yellow-600">Scheduled</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900">Need Help?</h3>
              <p className="text-sm text-gray-600">
                Access documentation, support tickets, and system guides
              </p>
            </div>
            <div className="flex space-x-4">
              <button className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                Documentation
              </button>
              <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
                Contact Support
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
