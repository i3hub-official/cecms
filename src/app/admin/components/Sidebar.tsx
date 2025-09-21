"use client";

import { useRouter, usePathname } from "next/navigation";
import { X, Sun, Moon, LogOut, Building } from "lucide-react";
import { motion } from "framer-motion";
import { navigation } from "./config/navigation";
import { useTheme } from "@/app/components/ThemeContext";
import { maskEmail, getInitials, getAvatarColor } from "./config/user";

interface SidebarProps {
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
  isDesktop: boolean;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  setShowLogoutModal: (open: boolean) => void;
}

export default function Sidebar({
  user,
  isDesktop,
  sidebarOpen,
  setSidebarOpen,
  setShowLogoutModal,
}: SidebarProps) {
  const { darkMode, toggleTheme } = useTheme();
  const pathname = usePathname();
  const router = useRouter();

  const isActivePath = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  const initials = getInitials(user.name);
  const avatarColor = getAvatarColor(user.name);

  return (
    <motion.aside
      key="sidebar"
      initial={{ x: "-100%" }}
      animate={{ x: sidebarOpen || isDesktop ? 0 : "-100%" }}
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
                router.push(item.href);
                setSidebarOpen(false);
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
  );
}
