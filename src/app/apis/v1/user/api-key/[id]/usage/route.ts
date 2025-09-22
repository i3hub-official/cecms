// src/app/apis/v1/user/api-key/[id]/usage/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/server/db/index";
import { apiKeys, apiUsageLogs } from "@/lib/server/db/schema";
import { eq, and, desc, sql, gte } from "drizzle-orm";
import { getUserFromCookies } from "@/lib/auth";

export async function GET(request: NextRequest, context: any) {
  try {
    const { id: apiKeyId } = context.params as { id: string };

    // Get user from cookies
    const user = await getUserFromCookies(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "7d";

    // Calculate date range based on period
    const startDate = new Date();
    switch (period) {
      case "1d":
        startDate.setDate(startDate.getDate() - 1);
        break;
      case "7d":
        startDate.setDate(startDate.getDate() - 7);
        break;
      case "30d":
        startDate.setDate(startDate.getDate() - 30);
        break;
      case "90d":
        startDate.setDate(startDate.getDate() - 90);
        break;
      default:
        startDate.setDate(startDate.getDate() - 7);
    }

    // Verify the API key belongs to the user
    const [apiKey] = await db
      .select()
      .from(apiKeys)
      .where(and(eq(apiKeys.id, apiKeyId), eq(apiKeys.adminId, user.id)));

    if (!apiKey) {
      return NextResponse.json({ error: "API key not found" }, { status: 404 });
    }

    // Fetch usage data
    const usageData = await db
      .select({
        date: sql<string>`DATE(${apiUsageLogs.createdAt})`,
        endpoint: apiUsageLogs.endpoint,
        requests: sql<number>`COUNT(*)`,
        averageResponseTime: sql<number>`AVG(${apiUsageLogs.requestTime})`,
        successRate: sql<number>`SUM(CASE WHEN ${apiUsageLogs.statusCode} < 400 THEN 1 ELSE 0 END) * 100.0 / COUNT(*)`,
      })
      .from(apiUsageLogs)
      .where(
        and(
          eq(apiUsageLogs.apiKeyId, apiKeyId),
          gte(apiUsageLogs.createdAt, startDate)
        )
      )
      .groupBy(sql`DATE(${apiUsageLogs.createdAt})`, apiUsageLogs.endpoint)
      .orderBy(desc(sql`DATE(${apiUsageLogs.createdAt})`));

    // Get total usage stats
    const totalUsage = await db
      .select({
        totalRequests: sql<number>`COUNT(*)`,
        uniqueEndpoints: sql<number>`COUNT(DISTINCT ${apiUsageLogs.endpoint})`,
        averageResponseTime: sql<number>`AVG(${apiUsageLogs.requestTime})`,
        errorRate: sql<number>`SUM(CASE WHEN ${apiUsageLogs.statusCode} >= 400 THEN 1 ELSE 0 END) * 100.0 / COUNT(*)`,
      })
      .from(apiUsageLogs)
      .where(
        and(
          eq(apiUsageLogs.apiKeyId, apiKeyId),
          gte(apiUsageLogs.createdAt, startDate)
        )
      );

    return NextResponse.json({
      success: true,
      data: {
        usage: usageData,
        summary: totalUsage[0] || {
          totalRequests: 0,
          uniqueEndpoints: 0,
          averageResponseTime: 0,
          errorRate: 0,
        },
        period,
        startDate: startDate.toISOString(),
        endDate: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("GET /api/user/api-key/[id]/usage error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
