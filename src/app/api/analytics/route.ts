// app/api/analytics/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from "@/lib/server/db/index";
import { 
  centers, 
  apiLogs, 
  adminSessions, 
  adminActivities,
  auditLogs,
  admins 
} from  "@/lib/server/db/schema";
import { eq, sql, and, gte, desc, count } from 'drizzle-orm';

interface CenterStats {
  total: number;
  active: number;
  inactive: number;
  recentlyCreated: number;
  byState: { state: string; count: number }[];
  byLga: { lga: string; state: string; count: number }[];
}

interface UsageStats {
  publicAPI: number;
  adminActions: number;
  totalSessions: number;
  activeSessions: number;
  apiCallsToday: number;
  uniqueUsers: number;
}

interface TrendData {
  date: string;
  centers: number;
  activity: number;
  apiCalls: number;
  sessions: number;
}

interface SystemHealth {
  uptime: string;
  responseTime: string;
  errorRate: string;
  dbConnections: number;
  memoryUsage: string;
  diskUsage: string;
}

interface AnalyticsData {
  centerStats: CenterStats;
  trends: TrendData[];
  usage: UsageStats;
  systemHealth: SystemHealth;
}

// Helper function to calculate date ranges
function getDateRange(range: string) {
  const now = new Date();
  const startDate = new Date();
  
  switch (range) {
    case '7d':
      startDate.setDate(now.getDate() - 7);
      break;
    case '30d':
      startDate.setDate(now.getDate() - 30);
      break;
    case '90d':
      startDate.setDate(now.getDate() - 90);
      break;
    case '1y':
      startDate.setFullYear(now.getFullYear() - 1);
      break;
    default:
      startDate.setDate(now.getDate() - 7);
  }
  
  return { startDate, endDate: now };
}

// Helper function to get system health metrics
async function getSystemHealth(): Promise<SystemHealth> {
  try {
    // Calculate uptime (simplified - you might want to use a proper monitoring solution)
    const uptimeStart = Date.now();
    
    // Get error rate from API logs
    const totalLogs = await db
      .select({ count: count() })
      .from(apiLogs)
      .where(gte(apiLogs.timestamp, new Date(Date.now() - 24 * 60 * 60 * 1000)));
    
    const errorLogs = await db
      .select({ count: count() })
      .from(apiLogs)
      .where(
        and(
          gte(apiLogs.timestamp, new Date(Date.now() - 24 * 60 * 60 * 1000)),
          gte(apiLogs.status, 400)
        )
      );
    
    const errorRate = totalLogs[0]?.count > 0 
      ? ((errorLogs[0]?.count || 0) / totalLogs[0].count * 100).toFixed(1)
      : '0.0';
    
    // Calculate average response time (simplified)
    const avgResponseTime = Math.floor(Math.random() * 100) + 50; // Mock data
    
    // Get active database connections (you'd need to implement this based on your DB setup)
    const dbConnections = 8; // Mock data
    
    return {
      uptime: '99.8%', // You'd calculate this from your monitoring system
      responseTime: `${avgResponseTime}ms`,
      errorRate: `${errorRate}%`,
      dbConnections,
      memoryUsage: '68%', // You'd get this from your server monitoring
      diskUsage: '45%',   // You'd get this from your server monitoring
    };
  } catch (error) {
    console.error('Error getting system health:', error);
    return {
      uptime: '0%',
      responseTime: '0ms',
      errorRate: '100%',
      dbConnections: 0,
      memoryUsage: '0%',
      diskUsage: '0%',
    };
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') || '7d';
    const { startDate, endDate } = getDateRange(range);

    // 1. Get Center Statistics
    const centerStatsQuery = await db
      .select({
        total: count(),
        active: sql<number>`COUNT(CASE WHEN ${centers.isActive} = true THEN 1 END)`,
        inactive: sql<number>`COUNT(CASE WHEN ${centers.isActive} = false THEN 1 END)`,
        recentlyCreated: sql<number>`COUNT(CASE WHEN ${centers.createdAt} >= ${new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)} THEN 1 END)`,
      })
      .from(centers);

    // Get centers by state
    const centersByState = await db
      .select({
        state: centers.state,
        count: count(),
      })
      .from(centers)
      .where(eq(centers.isActive, true))
      .groupBy(centers.state)
      .orderBy(desc(count()))
      .limit(10);

    // Get centers by LGA
    const centersByLga = await db
      .select({
        lga: centers.lga,
        state: centers.state,
        count: count(),
      })
      .from(centers)
      .where(eq(centers.isActive, true))
      .groupBy(centers.lga, centers.state)
      .orderBy(desc(count()))
      .limit(10);

    const centerStats: CenterStats = {
      total: centerStatsQuery[0]?.total || 0,
      active: centerStatsQuery[0]?.active || 0,
      inactive: centerStatsQuery[0]?.inactive || 0,
      recentlyCreated: centerStatsQuery[0]?.recentlyCreated || 0,
      byState: centersByState.map(item => ({
        state: item.state,
        count: item.count,
      })),
      byLga: centersByLga.map(item => ({
        lga: item.lga,
        state: item.state,
        count: item.count,
      })),
    };

    // 2. Get Usage Statistics
    const totalSessions = await db
      .select({ count: count() })
      .from(adminSessions)
      .where(gte(adminSessions.createdAt, startDate));

    const activeSessions = await db
      .select({ count: count() })
      .from(adminSessions)
      .where(
        and(
          eq(adminSessions.isActive, true),
          gte(adminSessions.expiresAt, new Date())
        )
      );

    const apiCallsTotal = await db
      .select({ count: count() })
      .from(apiLogs)
      .where(gte(apiLogs.timestamp, startDate));

    const apiCallsToday = await db
      .select({ count: count() })
      .from(apiLogs)
      .where(gte(apiLogs.timestamp, new Date(Date.now() - 24 * 60 * 60 * 1000)));

    const adminActionsCount = await db
      .select({ count: count() })
      .from(adminActivities)
      .where(gte(adminActivities.timestamp, startDate));

    const uniqueUsersCount = await db
      .select({ count: sql<number>`COUNT(DISTINCT ${adminSessions.adminId})` })
      .from(adminSessions)
      .where(gte(adminSessions.createdAt, startDate));

    const usage: UsageStats = {
      publicAPI: apiCallsTotal[0]?.count || 0,
      adminActions: adminActionsCount[0]?.count || 0,
      totalSessions: totalSessions[0]?.count || 0,
      activeSessions: activeSessions[0]?.count || 0,
      apiCallsToday: apiCallsToday[0]?.count || 0,
      uniqueUsers: uniqueUsersCount[0]?.count || 0,
    };

    // 3. Get Trend Data
    const trends: TrendData[] = [];
    const daysToShow = range === '7d' ? 7 : range === '30d' ? 30 : 7;
    
    for (let i = daysToShow - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dayStart = new Date(date);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(date);
      dayEnd.setHours(23, 59, 59, 999);

      // Get centers created on this day
      const centersCreated = await db
        .select({ count: count() })
        .from(centers)
        .where(
          and(
            gte(centers.createdAt, dayStart),
            gte(sql`${dayEnd}`, centers.createdAt)
          )
        );

      // Get activities on this day
      const activitiesCount = await db
        .select({ count: count() })
        .from(adminActivities)
        .where(
          and(
            gte(adminActivities.timestamp, dayStart),
            gte(sql`${dayEnd}`, adminActivities.timestamp)
          )
        );

      // Get API calls on this day
      const apiCallsCount = await db
        .select({ count: count() })
        .from(apiLogs)
        .where(
          and(
            gte(apiLogs.timestamp, dayStart),
            gte(sql`${dayEnd}`, apiLogs.timestamp)
          )
        );

      // Get sessions on this day
      const sessionsCount = await db
        .select({ count: count() })
        .from(adminSessions)
        .where(
          and(
            gte(adminSessions.createdAt, dayStart),
            gte(sql`${dayEnd}`, adminSessions.createdAt)
          )
        );

      trends.push({
        date: date.toISOString().split('T')[0],
        centers: centersCreated[0]?.count || 0,
        activity: activitiesCount[0]?.count || 0,
        apiCalls: apiCallsCount[0]?.count || 0,
        sessions: sessionsCount[0]?.count || 0,
      });
    }

    // 4. Get System Health
    const systemHealth = await getSystemHealth();

    const analyticsData: AnalyticsData = {
      centerStats,
      trends,
      usage,
      systemHealth,
    };

    return NextResponse.json(analyticsData);

  } catch (error) {
    console.error('Analytics API Error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch analytics data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
