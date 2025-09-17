"use client";
import { Shield, Menu, X, Moon, Sun } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "../ThemeContext";
import { motion, AnimatePresence } from "framer-motion";

export default function HeaderContext() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { darkMode, toggleTheme } = useTheme();
  const router = useRouter();
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target as Node) &&
        !(e.target as HTMLElement).closest("button[data-menu-toggle]")
      ) {
        setMobileMenuOpen(false);
      }
    };

    if (mobileMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [mobileMenuOpen]);

  return (
    <header className="shadow-sm border-b border-border bg-background transition-colors duration-300 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Desktop Layout */}
        <div className="hidden md:flex justify-between items-center py-4">
          {/* Left side - Logo and title */}
          <div className="flex items-center space-x-4">
            <div className="h-10 w-10 bg-primary rounded-lg flex items-center justify-center">
              <Shield className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">
                CECMS Admin Portal
              </h1>
              <p className="text-sm text-muted-foreground">
                Catholic Education Commission Management
              </p>
            </div>
          </div>

          {/* Right side - Theme + Auth buttons */}
          <div className="flex items-center space-x-3">
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

            <button
              onClick={() => router.push("/auth/signin")}
              className="px-4 py-2 rounded-lg border border-border hover:bg-muted transition-colors text-sm"
            >
              Sign In
            </button>
            <button
              onClick={() => router.push("/auth/signup")}
              className="px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors text-sm"
            >
              Sign Up
            </button>
          </div>
        </div>

        {/* Mobile Layout */}
        <div className="flex md:hidden justify-between items-center py-4">
          {/* Left - Hamburger */}
          <button
            data-menu-toggle
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-foreground hover:text-primary"
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>

          {/* Middle - Shortened brand */}
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center">
              <Shield className="h-5 w-5 text-primary-foreground" />
            </div>
            <h1 className="text-lg font-bold text-foreground">CECMS</h1>
          </div>

          {/* Right - Theme toggle */}
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
      </div>

      {/* Mobile menu dropdown with animation */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            ref={menuRef}
            key="mobileMenu"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full left-0 w-full bg-background border-t border-border px-4 py-3 space-y-3 z-50"
          >
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                router.push("/auth/signin");
              }}
              className="w-full px-4 py-2 rounded-lg border border-border hover:bg-muted transition-colors text-sm"
            >
              Sign In
            </button>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                router.push("/auth/signup");
              }}
              className="w-full px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors text-sm"
            >
              Sign Up
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
