"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import AdminLayout from "./components/AdminLayout";
import { ThemeProvider } from "@/app/components/ThemeContext"; // import your ThemeProvider

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

        const controller = new AbortController();
        const response = await fetch("/api/auth/validate", {
          method: "GET",
          credentials: "include",
          signal: controller.signal,
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
        setLoading(false); // show UI immediately
        validateSession(true); // background validation
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
    validateSession(true); // background check
  }, [pathname, validateSession]);

  /** 🔹 Logout */
  const handleLogout = async () => {
    try {
      await fetch("/api/auth", {
        method: "DELETE",
        credentials: "include",
      });
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      redirectToLogin();
    }
  };

  if (loading && !user) {
    return (
      <ThemeProvider>
        <div className="min-h-screen flex items-center justify-center bg-background text-foreground transition-colors duration-300">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
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
