"use client";

import { useEffect, useState } from "react";
import { useTheme } from "@/app/components/ThemeContext";
import { AnimatePresence } from "framer-motion";
import { Menu, Sun, Moon, Building } from "lucide-react";
import Sidebar from "./Sidebar";
import LogoutModal from "./LogoutModal";

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
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (isDesktop) {
      setSidebarOpen(false);
    }
  }, [isDesktop]);

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <AnimatePresence>
        {(isDesktop || sidebarOpen) && (
          <Sidebar
            user={user}
            isDesktop={isDesktop}
            sidebarOpen={sidebarOpen}
            setSidebarOpen={setSidebarOpen}
            setShowLogoutModal={setShowLogoutModal}
          />
        )}
      </AnimatePresence>

      {/* Mobile overlay */}
      {sidebarOpen && !isDesktop && (
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
      <LogoutModal
        open={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={onLogout}
      />
    </div>
  );
}
