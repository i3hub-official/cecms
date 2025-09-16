"use client";
import { quickStats } from "./FeaturesContext";
import { TrendingUp } from "lucide-react";

export default function QuickStatsContext() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {quickStats.map((stat, index) => {
        const Icon = stat.icon; // React component for the stat icon
        return (
          <div
            key={index}
            className="bg-background rounded-xl p-6 shadow-sm border border-border hover:shadow-md transition-all"
          >
            <div className="flex items-center justify-between mb-4">
              <div
                className={`h-10 w-10 rounded-lg flex items-center justify-center`}
                style={{
                  backgroundColor: `var(--${stat.color}-100)`,
                  color: `var(--${stat.color}-600)`,
                }}
              >
                <Icon className="h-6 w-6" />
              </div>
              <TrendingUp className="h-4 w-4 text-primary" />
            </div>
            <div className="text-2xl font-bold text-foreground mb-1">
              {stat.value}
            </div>
            <div className="text-sm text-muted-foreground">{stat.label}</div>
          </div>
        );
      })}
    </div>
  );
}
