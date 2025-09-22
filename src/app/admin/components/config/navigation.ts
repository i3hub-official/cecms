// File: src/app/admin/components/config/navigation.ts
import { Home, Building, BarChart3, Shield, Settings, Key } from "lucide-react";

export interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const navigation: NavItem[] = [
  { name: "Dashboard", href: "/admin", icon: Home },
  { name: "Centers", href: "/admin/centers", icon: Building },
  { name: "Analytics", href: "/admin/analytics", icon: BarChart3 },
  { name: "Sessions", href: "/admin/sessions", icon: Shield },
  { name: "Settings", href: "/admin/settings", icon: Settings },
  { name: "API Keys", href: "/admin/getApi", icon: Key },
  {name: "API Playground", href: "/dashboard/api-playground", icon: Key}
];
