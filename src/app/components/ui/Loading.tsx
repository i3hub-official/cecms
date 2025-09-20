// src/app/admin/layout.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import AdminLayout from "./components/AdminLayout";
import { ThemeProvider } from "@/app/components/ThemeContext";
import Loading from "@/app/components/ui/Loading";

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
  const [sessionValidating, setSessionValidating] = useState(false);

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
        if (!background) {
          setLoading(true);
        } else {
          setSessionValidating(true);
        }

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
        if (!background) {
          setLoading(false);
        } else {
          setSessionValidating(false);
        }
      }
    },
    [redirectToLogin] // Remove validateSession from its own dependencies
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
  }, []); // Empty dependency array - only run on mount

  /** 🔹 Revalidate on route changes */
  useEffect(() => {
    if (user && pathname) {
      validateSession(true);
    }
  }, [pathname]); // Only depend on pathname, not validateSession

  /** 🔹 Logout */
  const handleLogout = async () => {
    setLoading(true);
    
    try {
      await fetch("/api/auth/signout", {
        method: "DELETE",
        credentials: "include",
      });
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      redirectToLogin();
    }
  };

  // Show full-screen loading during initial authentication
  if (loading && !user) {
    return (
      <ThemeProvider>
        <div className="min-h-screen bg-background">
          <Loading 
            message="Authenticating..." 
            size="lg" 
            variant="spinner" 
            fullScreen 
          />
        </div>
      </ThemeProvider>
    );
  }

  // Return null if no user and not loading (will redirect to login)
  if (!user) {
    return null;
  }

  return (
    <ThemeProvider>
      <div className="relative">
        <AdminLayout user={user} onLogout={handleLogout}>
          {children}
        </AdminLayout>
        
        {/* Background session validation indicator */}
        {sessionValidating && (
          <div className="fixed top-4 right-4 z-50">
            <div className="bg-card border border-border rounded-lg shadow-lg px-3 py-2 flex items-center gap-2">
              <Loading 
                size="sm" 
                variant="dots" 
                message=""
              />
              <span className="text-xs text-muted-foreground">Syncing...</span>
            </div>
          </div>
        )}
      </div>
    </ThemeProvider>
  );
}