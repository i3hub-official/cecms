"use client";

import { useRouter, usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { useTheme } from "@/app/components/ThemeContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sun,
  Moon,
  Building,
  Settings,
  LogOut,
  Menu,
  X,
  Home,
  BarChart3,
  Shield,
  Key,
} from "lucide-react";

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

const maskEmail = (email: string): string => {
  if (!email || !email.includes("@")) return email;
  const [localPart, domain] = email.split("@");
  const firstChars = localPart.substring(0, 2);
  const lastChar =
    localPart.length > 2 ? localPart.substring(localPart.length - 1) : "";
  return `${firstChars}***${lastChar}@${domain}`;
};

const getInitials = (name: string): string => {
  if (!name) return "U";
  const names = name.trim().split(/\s+/);
  if (names.length === 1) {
    return names[0].charAt(0).toUpperCase();
  }
  return `${names[0].charAt(0)}${names[names.length - 1].charAt(
    0
  )}`.toUpperCase();
};

const getAvatarColor = (name: string): string => {
  const colors = [
    "bg-blue-500",
    "bg-green-500",
    "bg-purple-500",
    "bg-pink-500",
    "bg-red-500",
    "bg-yellow-500",
    "bg-indigo-500",
    "bg-teal-500",
  ];
  if (!name) return colors[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

export default function AdminLayout({
  children,
  user,
  onLogout,
  fluid = false,
}: AdminLayoutProps) {
  const { darkMode, toggleTheme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowLogoutModal(false);
        setSidebarOpen(false);
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, []);

  const navigation = [
    { name: "Dashboard", href: "/admin", icon: Home },
    { name: "Centers", href: "/admin/centers", icon: Building },
    { name: "Analytics", href: "/admin/analytics", icon: BarChart3 },
    { name: "Sessions", href: "/admin/sessions", icon: Shield },
    { name: "Settings", href: "/admin/settings", icon: Settings },
    { name: "API Keys", href: "/admin/getApi", icon: Key },
  ];

  const isActivePath = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  const initials = getInitials(user.name);
  const avatarColor = getAvatarColor(user.name);

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar (Desktop Static + Mobile Animated) */}
      <AnimatePresence>
        {(sidebarOpen || typeof window !== "undefined") && (
          <motion.aside
            key="sidebar"
            initial={{ x: "-100%" }}
            animate={{ x: sidebarOpen ? 0 : "-100%" }}
            exit={{ x: "-100%" }}
            transition={{ type: "tween", duration: 0.3 }}
            className={`fixed inset-y-0 left-0 z-50 w-64 bg-card text-card-foreground shadow-lg flex flex-col lg:static lg:translate-x-0`}
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

              <div className="hidden lg:flex items-center">
                <button
                  onClick={toggleTheme}
                  className="p-2 rounded-lg border border-border bg-background hover:bg-muted transition-colors"
                  aria-label="Toggle theme"
                >
                  {darkMode ? (
                    <Sun className="h-5 w-5 text-primary-foreground" />
                  ) : (
                    <Moon className="h-5 w-5 text-foreground" />
                  )}
                </button>
              </div>

              <button
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Navigation */}
            <nav className="mt-6 px-3 space-y-1 flex-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                const active = isActivePath(item.href);

                return (
                  <button
                    key={item.name}
                    onClick={() => {
                      router.push(item.href); // 🚀 client-side navigation (fast)
                      setSidebarOpen(false); // close sidebar on mobile
                    }}
                    className={`flex w-full items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors
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
                  </button>
                );
              })}
            </nav>

            {/* User Footer */}
            <div className="sticky bottom-0 bg-card border-t border-border p-4 mt-auto">
              <div className="flex items-center">
                <div
                  className={`w-8 h-8 ${avatarColor} rounded-full flex items-center justify-center text-white text-xs font-medium`}
                >
                  {initials}
                </div>
                <div className="ml-3 flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{user.name}</p>
                  <p
                    className="text-xs text-muted-foreground truncate"
                    title={user.email}
                  >
                    {maskEmail(user.email)}
                  </p>
                  <p className="text-xs text-muted-foreground/70 capitalize">
                    {user.role}
                  </p>
                </div>
                <button
                  onClick={() => setShowLogoutModal(true)}
                  className="ml-3 p-2 text-muted-foreground hover:text-foreground hover:bg-background rounded-lg transition-colors"
                  title="Logout"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <header className="bg-card text-card-foreground shadow-sm border-b border-border lg:hidden">
          <div className="flex items-center justify-between px-4 h-16">
            <button
              onClick={() => setSidebarOpen(true)}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <Menu className="h-6 w-6" />
            </button>

            <div className="flex-1 flex justify-center items-center">
              <Building className="h-6 w-6 text-primary mr-2" />
              <span className="font-medium">CMS Admin</span>
            </div>

            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg border border-border bg-background hover:bg-muted transition-colors"
              aria-label="Toggle theme"
            >
              {darkMode ? (
                <Sun className="h-5 w-5 text-primary-foreground" />
              ) : (
                <Moon className="h-5 w-5 text-foreground" />
              )}
            </button>
          </div>
        </header>

        <main className="flex-1 w-full p-4 sm:p-6 lg:p-8">{children}</main>
      </div>

      {/* Logout Modal */}
      <AnimatePresence>
        {showLogoutModal && (
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
            onClick={() => setShowLogoutModal(false)} // overlay closes modal
          >
            <motion.div
              key="modal"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="bg-card text-card-foreground rounded-2xl shadow-lg max-w-sm w-full p-6"
              onClick={(e) => e.stopPropagation()} // prevent overlay click
            >
              {/* User avatar + info */}
              <div className="flex items-center gap-3 mb-4">
                <div
                  className={`w-10 h-10 ${avatarColor} rounded-full flex items-center justify-center text-white text-sm font-medium`}
                >
                  {initials}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{user.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {maskEmail(user.email)}
                  </p>
                </div>
              </div>

              {/* Confirmation text */}
              <h2 className="text-lg font-semibold mb-2">Confirm Logout</h2>
              <p className="text-sm text-muted-foreground mb-4">
                Are you sure you want to log out of your account?
              </p>

              {/* Actions */}
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowLogoutModal(false)}
                  className="px-4 py-2 rounded-lg border border-border hover:bg-muted transition-colors text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setShowLogoutModal(false);
                    onLogout();
                  }}
                  className="px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors text-sm"
                >
                  Logout
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
