// src/app/admin/layout.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import AdminLayout from "./components/AdminLayout";

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

  const redirectToLogin = useCallback(() => {
    localStorage.removeItem("user");
    sessionStorage.removeItem("user");
    setUser(null);
    router.push("/auth/signin");
  }, [router]);

  const validateSession = useCallback(async () => {
    try {
      setLoading(true);
      
      // Clear any cached user data first
      const cachedUser = localStorage.getItem("user");
      if (cachedUser) {
        localStorage.removeItem("user");
      }

      const response = await fetch("/api/auth/validate", {
        method: "GET",
        credentials: "include",
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          "Pragma": "no-cache",
        },
      });

      // Check if response is unauthorized
      if (response.status === 401) {
        redirectToLogin();
        return;
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success && data.user) {
        setUser(data.user);
        // Use sessionStorage instead of localStorage for better security
        sessionStorage.setItem("user", JSON.stringify(data.user));
      } else {
        redirectToLogin();
      }
    } catch (error) {
      console.error("Session validation error:", error);
      redirectToLogin();
    } finally {
      setLoading(false);
    }
  }, [redirectToLogin]);

  useEffect(() => {
    validateSession();
  }, [pathname, validateSession]);

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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <AdminLayout user={user} onLogout={handleLogout}>
      {children}
    </AdminLayout>
  );
}