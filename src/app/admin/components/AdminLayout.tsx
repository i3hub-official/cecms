"use client";

import { useEffect, useState } from "react";
import { useTheme } from "@/app/components/ThemeContext";
import { AnimatePresence, motion } from "framer-motion";
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

      {/* Mobile overlay with enhanced animation */}
      <AnimatePresence>
        {sidebarOpen && !isDesktop && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Enhanced Header */}
        <header className="bg-card/95 backdrop-blur-sm text-card-foreground shadow-sm border-b border-border sticky top-0 z-30 lg:hidden">
          <div className="flex items-center justify-between px-4 h-16">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
            >
              <Menu className="h-5 w-5" />
            </motion.button>

            <div className="flex-1 flex justify-center items-center">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                  <Building className="h-4 w-4 text-primary-foreground" />
                </div>
                <span className="font-semibold text-foreground">CMS Admin</span>
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={toggleTheme}
              className="p-2 rounded-lg border border-border bg-background hover:bg-muted transition-colors"
              aria-label="Toggle theme"
            >
              {darkMode ? (
                <Sun className="h-5 w-5 text-muted-foreground" />
              ) : (
                <Moon className="h-5 w-5 text-muted-foreground" />
              )}
            </motion.button>
          </div>
        </header>

        {/* Main content with animation */}
        <main
          className={`flex-1 w-full p-4 sm:p-6 lg:p-8 ${
            fluid ? "" : "max-w-7xl mx-auto"
          }`}
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {children}
          </motion.div>
        </main>

        {/* Enhanced Footer */}
        <footer className="border-t border-border bg-card/50 mt-auto">
          <div
            className={`${
              fluid ? "w-full" : "max-w-7xl mx-auto w-full"
            } px-4 sm:px-6 lg:px-8 py-4`}
          >
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-sm text-muted-foreground text-center">
              <div className="flex items-center gap-4">
                <span>
                  &copy; 2024{" "}
                  <a
                    href="https://i3hub.vercel.app"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    I3 Hub
                  </a>
                  . All rights reserved.
                </span>
              </div>
            </div>
          </div>
        </footer>
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
