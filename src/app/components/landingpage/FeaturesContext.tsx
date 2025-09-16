'use client'
import {
  Activity,
  BarChart3,
  School,
  Users,
  Shield,
  Database,
  UserCheck,
  TrendingUp,
} from "lucide-react";

export const adminFeatures = [
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

export const quickStats = [
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

export const recentActivities = [
  "St. Mary's Catholic School - Profile Updated",
  "New administrator added to Sacred Heart High School",
  "System backup completed successfully",
  "Security scan completed - No issues found",
  "Holy Cross Elementary - User permissions updated",
];
