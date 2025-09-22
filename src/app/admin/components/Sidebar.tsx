"use client";

import { useRouter, usePathname } from "next/navigation";
import { X, Building, ChevronDown, Sun, Moon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { navigation } from "./config/navigation";
import { maskEmail, getInitials, getAvatarColor } from "./config/user";
import { useTheme } from "@/app/components/ThemeContext";

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

// Navigation Group Component
const NavigationGroup = ({
  title,
  items,
  pathname,
  router,
  setSidebarOpen,
}: {
  title?: string;
  items: any[];
  pathname: string;
  router: any;
  setSidebarOpen: (open: boolean) => void;
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const isActivePath = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  return (
    <div className="space-y-1">
      {title && (
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="flex items-center justify-between w-full px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors group"
        >
          <span>{title}</span>
          <ChevronDown
            className={`w-4 h-4 transition-transform ${
              isCollapsed ? "-rotate-90" : ""
            }`}
          />
        </button>
      )}

      <AnimatePresence>
        {!isCollapsed && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-1"
          >
            {items.map((item) => {
              const Icon = item.icon;
              const active = isActivePath(item.href);

              return (
                <motion.button
                  key={item.name}
                  whileHover={{ x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    router.push(item.href);
                    setSidebarOpen(false);
                  }}
                  className={`group flex w-full items-center px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 relative overflow-hidden
                    ${
                      active
                        ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    }`}
                >
                  {/* Active indicator */}
                  {active && (
                    <motion.div
                      layoutId="activeIndicator"
                      className="absolute inset-0 bg-gradient-to-r from-primary to-primary/80 rounded-xl"
                      transition={{ type: "spring", duration: 0.6 }}
                    />
                  )}

                  {/* Content */}
                  <div className="relative z-10 flex items-center w-full">
                    <div
                      className={`p-1 rounded-lg mr-3 transition-colors ${
                        active
                          ? "bg-white/20"
                          : "bg-muted/50 group-hover:bg-muted"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <span className="truncate">{item.name}</span>

                    {/* Badge for notifications */}
                    {item.badge && (
                      <span className="ml-auto bg-red-500 text-white text-xs rounded-full px-2 py-0.5 min-w-[18px] text-center">
                        {item.badge}
                      </span>
                    )}
                  </div>
                </motion.button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// User Profile Card Component
const UserProfileCard = ({
  user,
  setShowLogoutModal,
}: {
  user: SidebarProps["user"];
  setShowLogoutModal: (open: boolean) => void;
}) => {
  const initials = getInitials(user.name);
  const avatarColor = getAvatarColor(user.name);

  return (
    <div className="p-4 bg-muted/30 rounded-xl border border-border/50">
      <div className="flex items-center gap-3">
        <div className="relative">
          <div
            className={`w-10 h-10 ${avatarColor} rounded-xl flex items-center justify-center text-white text-sm font-semibold shadow-lg`}
          >
            {initials}
          </div>
          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-card rounded-full"></div>
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground truncate">
            {user.name}
          </p>
          <p
            className="text-xs text-muted-foreground truncate"
            title={user.email}
          >
            {maskEmail(user.email)}
          </p>
          <div className="flex items-center gap-2 mt-1">
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary capitalize">
              {user.role}
            </span>
          </div>
        </div>
      </div>

      <button
        onClick={() => setShowLogoutModal(true)}
        className="w-full mt-3 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors group"
      >
        <svg
          className="w-4 h-4 group-hover:rotate-12 transition-transform"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
          />
        </svg>
        Sign Out
      </button>
    </div>
  );
};

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

  // Organize your specific navigation items
  const organizeNavigation = () => {
    // Check if navigation items have a 'group' property for custom organization
    if (navigation.some((item) => (item as any).group)) {
      const grouped = navigation.reduce((acc, item) => {
        const group = (item as any).group || "main";
        if (!acc[group]) acc[group] = [];
        acc[group].push(item);
        return acc;
      }, {} as Record<string, any[]>);
      return grouped;
    }

    // Custom organization for your specific navigation
    const organized = {} as Record<string, any[]>;

    // Main dashboard item
    const dashboardItems = navigation.filter(
      (item) => item.name === "Dashboard"
    );

    // Management items (Centers, Sessions)
    const managementItems = navigation.filter((item) =>
      ["Centers", "Sessions"].includes(item.name)
    );

    // Analytics & Monitoring
    const analyticsItems = navigation.filter(
      (item) => item.name === "Analytics"
    );

    // System & Configuration
    const systemItems = navigation.filter((item) =>
      ["Settings", "API Keys"].includes(item.name)
    );

    // API Playground
    const playgroundItems = navigation.filter(
      (item) => item.name === "Playground"
    );

    // Build organized structure
    if (dashboardItems.length) organized.main = dashboardItems;
    if (managementItems.length) organized.management = managementItems;
    if (analyticsItems.length) organized.analytics = analyticsItems;
    if (systemItems.length) organized.system = systemItems;
    if (playgroundItems.length) organized.playground = playgroundItems;

    return organized;
  };

  const organizedNav = organizeNavigation();

  return (
    <motion.aside
      key="sidebar"
      initial={{ x: isDesktop ? 0 : "-100%" }}
      animate={{ x: sidebarOpen || isDesktop ? 0 : "-100%" }}
      exit={{ x: "-100%" }}
      transition={{ type: "spring", damping: 30, stiffness: 300 }}
      className="fixed inset-y-0 left-0 z-50 w-72 bg-card border-r border-border shadow-xl flex flex-col lg:static lg:translate-x-0"
    >
      {/* Enhanced Header */}
      <div className="flex items-center justify-between h-16 px-6 border-b border-border bg-gradient-to-r from-primary/5 to-primary/10">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary rounded-xl shadow-lg">
            <Building className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">CMS Admin</h1>
            <p className="text-xs text-muted-foreground">Management Portal</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Theme Toggle Button - Desktop */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={toggleTheme}
            className="hidden lg:flex items-center justify-center p-2 rounded-lg border border-border bg-background hover:bg-muted transition-colors shadow-sm"
            aria-label="Toggle theme"
          >
            {darkMode ? (
              <Sun className="h-4 w-4 text-primary" />
            ) : (
              <Moon className="h-4 w-4 text-foreground" />
            )}
          </motion.button>

          {/* Close button for mobile */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </motion.button>
        </div>
      </div>

      {/* Navigation Container */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Scrollable Navigation */}
        <nav className="flex-1 px-4 py-6 overflow-y-auto scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent space-y-6">
          {/* Your Navigation Structure */}
          {Object.entries(organizedNav).map(([groupKey, items]) => {
            const groupTitles: Record<string, string> = {
              main: "", // No title for Dashboard
              management: "Management",
              analytics: "Analytics",
              system: "System",
            };

            return (
              <NavigationGroup
                key={groupKey}
                title={
                  groupTitles[groupKey] ||
                  groupKey.charAt(0).toUpperCase() + groupKey.slice(1)
                }
                items={items}
                pathname={pathname}
                router={router}
                setSidebarOpen={setSidebarOpen}
              />
            );
          })}
        </nav>

        {/* User Profile Section */}
        <div className="p-4 border-t border-border bg-gradient-to-t from-muted/20 to-transparent">
          <UserProfileCard
            user={user}
            setShowLogoutModal={setShowLogoutModal}
          />
        </div>
      </div>

      {/* Quick Stats or Status Bar */}
      <div className="px-4 py-3 border-t border-border bg-muted/30">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>System Status</span>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span>Online</span>
          </div>
        </div>
      </div>
    </motion.aside>
  );
}
