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
    setUser(null);
    router.push("/auth/signin");
  }, [router]);

  /** 🔹 Validate session using your existing getUserFromCookies */
  const validateSession = useCallback(
    async (background = false) => {
      try {
        if (!background) setLoading(true);

        // Call your API endpoint that uses getUserFromCookies
        const response = await fetch("/api/auth/me", {
          method: "GET",
          credentials: "include",
        });

        if (!response.ok) {
          redirectToLogin();
          return;
        }

        const currentUser = await response.json();
        if (!currentUser) {
          redirectToLogin();
          return;
        }

        setUser(currentUser);
      } catch (error) {
        console.error("Session validation error:", error);
        redirectToLogin();
      } finally {
        if (!background) setLoading(false);
      }
    },
    [redirectToLogin]
  );

  /** 🔹 On mount: validate session */
  useEffect(() => {
    validateSession();
  }, []); // run once on mount

  /** 🔹 Revalidate on route changes */
  useEffect(() => {
    if (user && !loggingOut && pathname) {
      validateSession(true);
    }
  }, [pathname]); // only revalidate on route changes

  /** 🔹 Logout with loading state */
  const handleLogout = async () => {
    setLoggingOut(true);

    try {
      await fetch("/api/auth/signout", {
        method: "POST",
        credentials: "include",
      });
      // optional small delay for UX
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setLoggingOut(false);
      redirectToLogin();
    }
  };

  /** 🔹 Loading UI */
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

  /** 🔹 Logout animation */
  if (loggingOut) {
    return (
      <ThemeProvider>
        <div className="min-h-screen flex items-center justify-center bg-background text-foreground transition-colors duration-300">
          <div className="flex flex-col items-center gap-6 text-center">
            <div className="relative">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-muted"></div>
              <div className="absolute inset-0 animate-spin rounded-full h-16 w-16 border-4 border-transparent border-t-red-500"></div>
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

            <div className="space-y-2">
              <div className="text-lg font-semibold text-foreground">
                Signing Out...
              </div>
              <div className="text-sm text-muted-foreground max-w-md">
                Safely ending your admin session and clearing your data
              </div>
            </div>

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

            <div className="text-xs text-muted-foreground">
              Your session will be securely terminated
            </div>
          </div>
        </div>
      </ThemeProvider>
    );
  }

  if (!user) return null;

  return (
    <ThemeProvider>
      <AdminLayout user={user} onLogout={handleLogout}>
        {children}
      </AdminLayout>
    </ThemeProvider>
  );
}
