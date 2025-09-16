"use client";
import React, { createContext, useContext, useEffect, useState } from "react";

interface ThemeContextType {
  darkMode: boolean;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [darkMode, setDarkMode] = useState(false);
  const [isMounted, setIsMounted] = useState(false); // Track if theme is initialized

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedTheme = localStorage.getItem("theme");

      let isDarkMode: boolean;

      if (savedTheme === "dark") {
        isDarkMode = true;
      } else if (savedTheme === "light") {
        isDarkMode = false;
      } else {
        // fallback to system preference
        isDarkMode = window.matchMedia("(prefers-color-scheme: dark)").matches;
        localStorage.setItem("theme", isDarkMode ? "dark" : "light");
      }

      setDarkMode(isDarkMode);
      document.documentElement.classList.toggle("dark", isDarkMode);
      setIsMounted(true);
    }
  }, []);

  const toggleTheme = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    document.documentElement.classList.toggle("dark", newDarkMode);
    localStorage.setItem("theme", newDarkMode ? "dark" : "light");
  };

  if (!isMounted) return null; // prevent FOUC

  return (
    <ThemeContext.Provider value={{ darkMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used within a ThemeProvider");
  return context;
};
