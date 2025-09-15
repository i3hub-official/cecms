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

    const [
      totalCenters,
      activeCenters,
      recentlyCreatedCount,
      usageData,
      trendData,
      systemStats,
    ] = await Promise.all([
      prisma.center.count(),
      prisma.center.count({ where: { isActive: true } }),
      prisma.center.count({ where: { createdAt: { gte: startDate } } }),
      Promise.all([
        prisma.apiLog.count({
          where: {
            timestamp: { gte: startDate },
            endpoint: { contains: "lookup" },
          },
        }),
        prisma.adminActivity.count({
          where: { timestamp: { gte: startDate } },
        }),
        prisma.adminSession.count({
          where: { isActive: true, expiresAt: { gt: now } },
        }),
      ]),
      prisma.center.groupBy({
        by: ["createdAt"],
        where: { createdAt: { gte: startDate } },
        _count: { _all: true },
        orderBy: { createdAt: "asc" },
      }),
      Promise.resolve({
        uptime: "99.9%",
        responseTime: "245ms",
        errorRate: "0%",
      }),
    ]);

    const trends = (trendData as any[]).map((t) => ({
      date: t.createdAt.toISOString().split("T")[0],
      activity: t._count._all,
    }));

    const analyticsData: AnalyticsData = {
      centerStats: {
        total: totalCenters,
        active: activeCenters,
        inactive: totalCenters - activeCenters,
        recentlyCreated: recentlyCreatedCount,
      },
      usage: {
        publicAPI: usageData[0],
        adminActions: usageData[1],
        totalSessions: usageData[2],
      },
      systemHealth: systemStats,
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
