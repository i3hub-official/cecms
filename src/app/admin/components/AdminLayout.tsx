"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useTheme } from "@/app/components/ThemeContext";
import {
  Sun,
  Moon,
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
  fluid?: boolean;
}

export default function AdminLayout({
  children,
  user,
  onLogout,
  fluid = false,
}: AdminLayoutProps) {
  const { darkMode, toggleTheme } = useTheme();
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

  const isActivePath = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-card text-card-foreground shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        {/* Sidebar Header */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-border">
          <div className="flex items-center space-x-3">
            <Building className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-lg font-semibold">CMS Admin</h1>
              <p className="text-xs text-muted-foreground">v1.0</p>
            </div>
          </div>

          {/* Desktop Theme Toggle */}
          <div className="hidden lg:flex items-center">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg border border-border bg-background hover:bg-muted transition-colors"
              aria-label="Toggle theme"
            >
              {darkMode ? (
                <Sun className="h-5 w-5 text-accent" />
              ) : (
                <Moon className="h-5 w-5 text-foreground" />
              )}
            </button>
          </div>

          {/* Mobile Close */}
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="mt-6 px-3 space-y-1">
          {navigation.map((item) => {
            const Icon = item.icon;
            const active = isActivePath(item.href);
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors
                  ${
                    active
                      ? "bg-primary/10 text-primary border-r-2 border-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-background hover:border-r-2 hover:border-primary"
                  }`}
              >
                <Icon
                  className={`mr-3 h-5 w-5 ${
                    active ? "text-primary" : "text-muted-foreground"
                  }`}
                />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* User Footer */}
        <div className="absolute bottom-0 inset-x-0 p-4 border-t border-border">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
              <Users className="w-4 h-4 text-primary" />
            </div>
            <div className="ml-3 flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user.name}</p>
              <p className="text-xs text-muted-foreground truncate">
                {user.email}
              </p>
              <p className="text-xs text-muted-foreground/70 capitalize">
                {user.role}
              </p>
            </div>
            <button
              onClick={onLogout}
              className="ml-3 text-muted-foreground hover:text-foreground transition-colors"
              title="Logout"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Mobile top bar */}
        <header className="bg-card text-card-foreground shadow-sm border-b border-border lg:hidden">
          <div className="flex items-center justify-between px-4 h-16">
            {/* Hamburger left */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <Menu className="h-6 w-6" />
            </button>

            {/* Brand name center */}
            <div className="flex-1 flex justify-center items-center">
              <Building className="h-6 w-6 text-primary mr-2" />
              <span className="font-medium">CMS Admin</span>
            </div>

            {/* Theme toggle right */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg border border-border bg-background hover:bg-muted transition-colors"
              aria-label="Toggle theme"
            >
              {darkMode ? (
                <Sun className="h-5 w-5 text-accent" />
              ) : (
                <Moon className="h-5 w-5 text-foreground" />
              )}
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 w-full p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
