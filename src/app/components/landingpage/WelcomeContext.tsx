"use client";
import { Activity } from "lucide-react";

export default function WelcomeContext() {
  return (
    <div className="rounded-2xl p-8 mb-8 bg-background text-foreground transition-colors duration-300">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">
            Welcome to CECMS Admin Portal
          </h1>
          <p className="text-accent-foreground text-lg">
            Centralized management for all Catholic schools in your diocese
          </p>
        </div>
        <div className="hidden lg:block">
          <div className="bg-background/20 dark:bg-background/30 backdrop-blur-sm rounded-xl p-4">
            <Activity className="h-12 w-12 text-accent-foreground/80" />
          </div>
        </div>
      </div>
    </div>
  );
}
