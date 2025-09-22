// src/app/api/analytics/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/server/db/index";
import {
  centers,
  apiLogs,
  adminSessions,
  adminActivities,
} from "@/lib/server/db/schema";
import { eq, sql, and, gte, desc, count, lte } from "drizzle-orm";
import { getUserFromCookies } from "@/lib/auth";

// ... Keep all interfaces and helper functions (getDateRange, formatDateForSQL) as-is ...

// Mock implementation of getSystemHealth function
async function getSystemHealth(): Promise<{ status: string; details: string }> {
  return { status: "Healthy", details: "All systems operational" };
}

export async function GET(request: NextRequest) {
  try {
    // Get authenticated user from cookies
    const authUser = await getUserFromCookies(request);
    if (!authUser) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Only allow ADMIN or SUPER_ADMIN
    if (authUser.role !== "ADMIN" && authUser.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { success: false, error: "Insufficient permissions to view analytics" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const range = searchParams.get("range") || "7d";
    const { startDate, endDate } = getDateRange(range);

    // Format dates for SQL queries
    const sqlStartDate = formatDateForSQL(startDate);
    const sqlEndDate = formatDateForSQL(endDate);
    const sevenDaysAgo = formatDateForSQL(
      new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    );

    // 1. Get Center Statistics
    const centerStatsQuery = await db
      .select({
        total: count(),
        active: sql<number>`COUNT(CASE WHEN ${centers.isActive} = true THEN 1 END)`,
        inactive: sql<number>`COUNT(CASE WHEN ${centers.isActive} = false THEN 1 END)`,
        recentlyCreated: sql<number>`COUNT(CASE WHEN ${centers.createdAt} >= ${sevenDaysAgo} THEN 1 END)`,
      })
      .from(centers);

    const centersByState = await db
      .select({ state: centers.state, count: count() })
      .from(centers)
      .where(eq(centers.isActive, true))
      .groupBy(centers.state)
      .orderBy(desc(count()))
      .limit(10);

    const centersByLga = await db
      .select({ lga: centers.lga, state: centers.state, count: count() })
      .from(centers)
      .where(eq(centers.isActive, true))
      .groupBy(centers.lga, centers.state)
      .orderBy(desc(count()))
      .limit(10);

    const centerStats = {
      total: centerStatsQuery[0]?.total || 0,
      active: centerStatsQuery[0]?.active || 0,
      inactive: centerStatsQuery[0]?.inactive || 0,
      recentlyCreated: centerStatsQuery[0]?.recentlyCreated || 0,
      byState: centersByState.map((item) => ({
        state: item.state || "Unknown",
        count: item.count,
      })),
      byLga: centersByLga.map((item) => ({
        lga: item.lga || "Unknown",
        state: item.state || "Unknown",
        count: item.count,
      })),
    };

    // 2. Usage Statistics
    const totalSessions = await db
      .select({ count: count() })
      .from(adminSessions)
      .where(gte(adminSessions.createdAt, new Date(sqlStartDate)));

    const activeSessions = await db
      .select({ count: count() })
      .from(adminSessions)
      .where(
        and(
          eq(adminSessions.isActive, true),
          gte(adminSessions.expiresAt, new Date(sqlStartDate))
        )
      );

    const apiCallsTotal = await db
      .select({ count: count() })
      .from(apiLogs)
      .where(gte(apiLogs.timestamp, new Date(sqlStartDate)));

    const twentyFourHoursAgo = formatDateForSQL(
      new Date(Date.now() - 24 * 60 * 60 * 1000)
    );
    const apiCallsToday = await db
      .select({ count: count() })
      .from(apiLogs)
      .where(gte(apiLogs.timestamp, new Date(twentyFourHoursAgo)));

    const adminActionsCount = await db
      .select({ count: count() })
      .from(adminActivities)
      .where(gte(adminActivities.timestamp, new Date(sqlStartDate)));

    const uniqueUsersCount = await db
      .select({ count: sql<number>`COUNT(DISTINCT ${adminSessions.adminId})` })
      .from(adminSessions)
      .where(gte(adminSessions.createdAt, new Date(sqlStartDate)));

    const usage = {
      publicAPI: apiCallsTotal[0]?.count || 0,
      adminActions: adminActionsCount[0]?.count || 0,
      totalSessions: totalSessions[0]?.count || 0,
      activeSessions: activeSessions[0]?.count || 0,
      apiCallsToday: apiCallsToday[0]?.count || 0,
      uniqueUsers: uniqueUsersCount[0]?.count || 0,
    };

    // 3. Trend Data
    const trends: { date: string; centers: number; activity: number; apiCalls: number; sessions: number; }[] = [];
    const daysToShow = range === "7d" ? 7 : range === "30d" ? 30 : 7;

    for (let i = daysToShow - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dayStart = new Date(date);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(date);
      dayEnd.setHours(23, 59, 59, 999);
      const sqlDayStart = formatDateForSQL(dayStart);
      const sqlDayEnd = formatDateForSQL(dayEnd);

      const centersCreated = await db
        .select({ count: count() })
        .from(centers)
        .where(
          and(
            gte(centers.createdAt, new Date(sqlDayStart)),
            lte(centers.createdAt, new Date(sqlDayEnd))
          )
        );

      const activitiesCount = await db
        .select({ count: count() })
        .from(adminActivities)
        .where(
          and(
            gte(adminActivities.timestamp, new Date(sqlDayStart)),
            lte(adminActivities.timestamp, new Date(sqlDayEnd))
          )
        );

      const apiCallsCount = await db
        .select({ count: count() })
        .from(apiLogs)
        .where(
          and(
            gte(apiLogs.timestamp, new Date(sqlDayStart)),
            lte(apiLogs.timestamp, new Date(sqlDayEnd))
          )
        );

      const sessionsCount = await db
        .select({ count: count() })
        .from(adminSessions)
        .where(
          and(
            gte(adminSessions.createdAt, new Date(sqlDayStart)),
            lte(adminSessions.createdAt, new Date(sqlDayEnd))
          )
        );

      trends.push({
        date: date.toISOString().split("T")[0],
        centers: centersCreated[0]?.count || 0,
        activity: activitiesCount[0]?.count || 0,
        apiCalls: apiCallsCount[0]?.count || 0,
        sessions: sessionsCount[0]?.count || 0,
      });
    }

    // 4. System Health
    const systemHealth = await getSystemHealth();

    return NextResponse.json({
      centerStats,
      trends,
      usage,
      systemHealth,
    });
  } catch (error) {
    console.error("Analytics API Error:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch analytics data",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
function formatDateForSQL(date: Date): string {
  return date.toISOString().slice(0, 19).replace("T", " ");
}
function getDateRange(range: string): { startDate: Date; endDate: Date } {
  const endDate = new Date();
  let startDate: Date;

  switch (range) {
    case "7d":
      startDate = new Date();
      startDate.setDate(endDate.getDate() - 7);
      break;
    case "30d":
      startDate = new Date();
      startDate.setDate(endDate.getDate() - 30);
      break;
    case "90d":
      startDate = new Date();
      startDate.setDate(endDate.getDate() - 90);
      break;
    case "1y":
      startDate = new Date();
      startDate.setFullYear(endDate.getFullYear() - 1);
      break;
    default:
      throw new Error(`Unsupported range: ${range}`);
  }

  return { startDate, endDate };
}

