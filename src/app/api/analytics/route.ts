import { NextRequest, NextResponse } from "next/server";
import { validateSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Types
interface AnalyticsData {
  centerStats: {
    total: number;
    active: number;
    inactive: number;
    recentlyCreated: number;
  };
  usage: {
    publicAPI: number;
    adminActions: number;
    totalSessions: number;
  };
  systemHealth: {
    uptime: string;
    responseTime: string;
    errorRate: string;
  };
  trends: {
    date: string;
    activity: number;
  }[];
}

export async function GET(request: NextRequest) {
  try {
    const authResult = await validateSession(request);
    if (!authResult.isValid) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const range = searchParams.get("range") || "7d";

    const now = new Date();
    const startDate = new Date();
    switch (range) {
      case "30d":
        startDate.setDate(now.getDate() - 30);
        break;
      case "90d":
        startDate.setDate(now.getDate() - 90);
        break;
      case "7d":
      default:
        startDate.setDate(now.getDate() - 7);
    }

    // Only query models that exist in your schema
    const [
      totalCenters,
      activeCenters,
      recentlyCreatedCount,
      recentCenters,
    ] = await Promise.all([
      prisma.center.count(),
      prisma.center.count({ where: { isActive: true } }),
      prisma.center.count({ where: { createdAt: { gte: startDate } } }),
      prisma.center.findMany({
        where: { createdAt: { gte: startDate } },
        select: { createdAt: true },
        orderBy: { createdAt: "asc" },
      }),
    ]);

    // Create trend data from recent centers
    const trendMap = new Map<string, number>();
    recentCenters.forEach(center => {
      const date = center.createdAt.toISOString().split("T")[0];
      trendMap.set(date, (trendMap.get(date) || 0) + 1);
    });

    const trends = Array.from(trendMap.entries()).map(([date, activity]) => ({
      date,
      activity,
    }));

    const analyticsData: AnalyticsData = {
      centerStats: {
        total: totalCenters,
        active: activeCenters,
        inactive: totalCenters - activeCenters,
        recentlyCreated: recentlyCreatedCount,
      },
      usage: {
        // Mock data since we don't have these tables yet
        publicAPI: Math.floor(Math.random() * 1000),
        adminActions: Math.floor(Math.random() * 100),
        totalSessions: Math.floor(Math.random() * 50),
      },
      systemHealth: {
        uptime: "99.9%",
        responseTime: "245ms",
        errorRate: "0.1%",
      },
      trends,
    };

    return NextResponse.json({ success: true, data: analyticsData });
  } catch (error) {
    console.error("Analytics API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to load analytics data",
        details:
          process.env.NODE_ENV === "development" && error instanceof Error
            ? error.message
            : undefined,
      },
      { status: 500 }
    );
  }
}