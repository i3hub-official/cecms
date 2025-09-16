"use client";
import React, { useState } from "react";
import HeaderContext from "./components/landingpage/HeaderContext";
import WelcomeContext from "./components/landingpage/WelcomeContext";
import QuickStatsContext from "./components/landingpage/QuickStatsContext";
import AdministrativeFuncContext from "./components/landingpage/AdministrativeFuncContext";
import QuickActionContext from "./components/landingpage/QuickActionContext";
import FooterContext from "./components/landingpage/FooterContext";

export default function CECMSAdminPortal() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
      {/* Header */}
      <HeaderContext />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <WelcomeContext />

        {/* Quick Stats */}
        <QuickStatsContext />

        {/* Main Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Administrative Functions */}
          <AdministrativeFuncContext />

          {/* Quick Actions & Recent Activity */}
          <QuickActionContext />
        </div>

        {/* Footer Actions */}
        <FooterContext />
      </div>
    </div>
  );
}
