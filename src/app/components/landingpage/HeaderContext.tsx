"use client";
import { Shield, Menu, X, Moon, Sun } from "lucide-react";
import { useState } from "react";
import { useTheme } from "../ThemeContext";

export default function HeaderContext() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { darkMode, toggleTheme } = useTheme();

  return (
    <header className="shadow-sm border-b border-border bg-background transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          {/* Left side - Logo and title */}
          <div className="flex items-center space-x-4">
            <div className="h-10 w-10 bg-gradient-to-br from-indigo-600 to-blue-600 rounded-lg flex items-center justify-center">
              <Shield className="h-6 w-6 text-foreground" />
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

          {/* Right side - Theme toggle only */}
          <div className="flex items-center">
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

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 ml-2 text-foreground hover:text-primary"
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
