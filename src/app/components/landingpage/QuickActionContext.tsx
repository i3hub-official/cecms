"use client";
import React from "react";
import { Plus, Users, BarChart3, Settings } from "lucide-react";
import { recentActivities } from "./FeaturesContext";

export default function QuickActionContext() {
  return (
    <div className="space-y-6">
      {/* Quick Actions */}
      <div className="bg-background rounded-2xl shadow-sm border border-border p-6 transition-colors duration-300">
        <h3 className="font-semibold text-foreground mb-4">Quick Actions</h3>
        <div className="space-y-3">
          <button className="w-full flex items-center space-x-3 p-3 text-left border border-border rounded-lg hover:bg-muted transition-colors">
            <Plus className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium text-foreground">
              Add New School
            </span>
          </button>
          <button className="w-full flex items-center space-x-3 p-3 text-left border border-border rounded-lg hover:bg-muted transition-colors">
            <Users className="h-5 w-5 text-secondary" />
            <span className="text-sm font-medium text-foreground">
              Manage Users
            </span>
          </button>
          <button className="w-full flex items-center space-x-3 p-3 text-left border border-border rounded-lg hover:bg-muted transition-colors">
            <BarChart3 className="h-5 w-5 text-accent" />
            <span className="text-sm font-medium text-foreground">
              View Analytics
            </span>
          </button>
          <button className="w-full flex items-center space-x-3 p-3 text-left border border-border rounded-lg hover:bg-muted transition-colors">
            <Settings className="h-5 w-5 text-foreground" />
            <span className="text-sm font-medium text-foreground">
              System Settings
            </span>
          </button>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-background rounded-2xl shadow-sm border border-border p-6 transition-colors duration-300">
        <h3 className="font-semibold text-foreground mb-4">Recent Activity</h3>
        <div className="space-y-3">
          {recentActivities.map((activity, index) => (
            <div key={index} className="flex items-start space-x-3 text-sm">
              <div className="h-2 w-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
              <span className="text-muted-foreground">{activity}</span>
            </div>
          ))}
        </div>
        <button className="w-full mt-4 text-sm text-primary hover:text-primary/90 font-medium transition-colors">
          View All Activity →
        </button>
      </div>

      {/* System Status */}
      <div className="bg-background rounded-2xl shadow-sm border border-border p-6 transition-colors duration-300">
        <h3 className="font-semibold text-foreground mb-4">System Status</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Database</span>
            <div className="flex items-center space-x-2">
              <div className="h-2 w-2 bg-primary rounded-full"></div>
              <span className="text-sm text-primary">Online</span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">API Services</span>
            <div className="flex items-center space-x-2">
              <div className="h-2 w-2 bg-primary rounded-full"></div>
              <span className="text-sm text-primary">Online</span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Backup Status</span>
            <div className="flex items-center space-x-2">
              <div className="h-2 w-2 bg-accent rounded-full"></div>
              <span className="text-sm text-accent">Scheduled</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
