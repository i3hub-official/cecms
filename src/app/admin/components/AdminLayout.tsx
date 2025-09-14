"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  Building,
  Users,
  Settings,
  LogOut,
  Menu,
  X,
  Home,
  BarChart3,
  Shield,
} from "lucide-react";
import { useState, useEffect } from "react";

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface AdminLayoutProps {
  children: React.ReactNode;
  user: User;
  onLogout: () => void;
}

export default function AdminLayout({
  children,
  user,
  onLogout,
}: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const navigation = [
    { name: "Dashboard", href: "/admin", icon: Home },
    { name: "Centers", href: "/admin/centers", icon: Building },
    { name: "Analytics", href: "/admin/analytics", icon: BarChart3 },
    { name: "Sessions", href: "/admin/sessions", icon: Shield },
    { name: "Settings", href: "/admin/settings", icon: Settings },
  ];

  const isActivePath = (href: string) => {
    if (href === "/admin") {
      return pathname === "/admin";
    }
    return pathname.startsWith(href);
  };

  // Close sidebar when route changes (on mobile)
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const sidebar = document.querySelector(".sidebar");
      if (sidebarOpen && sidebar && !sidebar.contains(event.target as Node)) {
        setSidebarOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [sidebarOpen]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 sidebar
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
      `}
      >
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
          <div className="flex items-center">
            <Building className="h-8 w-8 text-blue-600" />
            <div className="ml-3">
              <h1 className="text-lg font-semibold text-gray-900">CMS Admin</h1>
              <p className="text-xs text-gray-500">v1.0</p>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <nav className="mt-6 px-3">
          <div className="space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              const active = isActivePath(item.href);

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`
                    flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors
                    ${
                      active
                        ? "bg-blue-50 text-blue-700 border-r-2 border-blue-600"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                    }
                  `}
                >
                  <Icon
                    className={`mr-3 h-5 w-5 ${
                      active ? "text-blue-600" : "text-gray-400"
                    }`}
                  />
                  {item.name}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* User info */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <Users className="w-4 h-4 text-blue-600" />
              </div>
            </div>
            <div className="ml-3 flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user.name}
              </p>
              <p className="text-xs text-gray-500 truncate">{user.email}</p>
              <p className="text-xs text-gray-400 capitalize">{user.role}</p>
            </div>
            <button
              onClick={onLogout}
              className="ml-3 text-gray-400 hover:text-gray-600 transition-colors"
              title="Logout"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <div className="bg-white shadow-sm border-b border-gray-200 lg:hidden">
          <div className="flex items-center justify-between px-4 h-16">
            <button
              onClick={() => setSidebarOpen(true)}
              className="text-gray-400 hover:text-gray-600"
            >
              <Menu className="h-6 w-6" />
            </button>
            <div className="flex items-center">
              <Building className="h-6 w-6 text-blue-600 mr-2" />
              <span className="font-medium text-gray-900">CMS Admin</span>
            </div>
            <div className="w-6"></div> {/* Spacer for balance */}
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
