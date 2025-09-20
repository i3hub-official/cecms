// src/app/admin/layout.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import AdminLayout from "./components/AdminLayout";
import { ThemeProvider } from "@/app/components/ThemeContext";

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

export default function AdminLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  /** 🔹 Redirect helper */
  const redirectToLogin = useCallback(() => {
    sessionStorage.removeItem("user");
    setUser(null);
    router.push("/auth/signin");
  }, [router]);

  /** 🔹 Validate session against backend */
  const validateSession = useCallback(
    async (background = false) => {
      try {
        if (!background) setLoading(true);

        const response = await fetch("/api/auth/validate", {
          method: "GET",
          credentials: "include",
          headers: {
            "Cache-Control": "no-cache, no-store, must-revalidate",
            Pragma: "no-cache",
          },
        });

        if (response.status === 401) {
          redirectToLogin();
          return;
        }

        if (!response.ok) {
          console.error("Server error during validation:", response.status);
          return;
        }

        const data = await response.json();

        if (data.success && data.user) {
          setUser(data.user);
          sessionStorage.setItem("user", JSON.stringify(data.user));
        } else {
          redirectToLogin();
        }
      } catch (error) {
        console.error("Session validation error:", error);
        redirectToLogin();
      } finally {
        if (!background) setLoading(false);
      }
    },
    [redirectToLogin]
  );

  /** 🔹 On first mount: try cached user instantly, then validate */
  useEffect(() => {
    const cached = sessionStorage.getItem("user");
    if (cached) {
      try {
        const parsedUser: User = JSON.parse(cached);
        setUser(parsedUser);
        setLoading(false);
        validateSession(true);
      } catch {
        sessionStorage.removeItem("user");
        validateSession();
      }
    } else {
      validateSession();
    }
  }, [validateSession]);

  /** 🔹 Revalidate on route changes */
  useEffect(() => {
    validateSession(true);
  }, [pathname, validateSession]);

  /** 🔹 Logout with loading state */
  const handleLogout = async () => {
    setLoggingOut(true);

    try {
      const response = await fetch("/api/auth/signout", {
        method: "DELETE",
        credentials: "include",
      });

      // Optional: handle response status
      if (!response.ok) {
        console.warn("Logout API returned non-OK status:", response.status);
      }

      // Add a small delay for better UX feedback
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      // Always redirect regardless of API success/failure
      setLoggingOut(false);
      redirectToLogin();
    }
  };

  // Show initial loading screen
  if (loading && !user) {
    return (
      <ThemeProvider>
        <div className="min-h-screen flex items-center justify-center bg-background text-foreground transition-colors duration-300">
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            <div className="text-muted-foreground text-sm font-medium">
              Authenticating...
            </div>
          </div>
        </div>
      </ThemeProvider>
    );
  }

  // Show logout loading screen
  if (loggingOut) {
    return (
      <ThemeProvider>
        <div className="min-h-screen flex items-center justify-center bg-background text-foreground transition-colors duration-300">
          <div className="flex flex-col items-center gap-6 text-center">
            {/* Logout Animation */}
            <div className="relative">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-muted"></div>
              <div className="absolute inset-0 animate-spin rounded-full h-16 w-16 border-4 border-transparent border-t-red-500"></div>

              {/* Logout Icon */}
              <div className="absolute inset-0 flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-red-500"
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
              </div>
            </div>

            {/* Logout Message */}
            <div className="space-y-2">
              <div className="text-lg font-semibold text-foreground">
                Signing Out...
              </div>
              <div className="text-sm text-muted-foreground max-w-md">
                Safely ending your admin session and clearing your data
              </div>
            </div>

            {/* User Info */}
            {user && (
              <div className="flex items-center gap-3 px-4 py-2 bg-card border border-border rounded-lg">
                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                  <span className="text-xs font-semibold text-primary">
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="text-left">
                  <div className="text-sm font-medium text-foreground">
                    {user.name}
                  </div>
                  <div className="text-xs text-muted-foreground capitalize">
                    {user.role}
                  </div>
                </div>
              </div>
            )}

            {/* Security Note */}
            <div className="text-xs text-muted-foreground">
              Your session will be securely terminated
            </div>
          </div>
        </div>
      </ThemeProvider>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <ThemeProvider>
      <AdminLayout user={user} onLogout={handleLogout}>
        {children}
      </AdminLayout>
    </ThemeProvider>
  );
}
