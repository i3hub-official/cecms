// src/app/api/centers/stats/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/server/db/index";
import { centers } from "@/lib/server/db/schema";
import { getUserFromCookies } from "@/lib/auth";
import { eq, desc, sql } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    // Get user from cookies using simplified auth
    const user = await getUserFromCookies(request);
    
    if (!user) {
      console.log("Centers stats API: Unauthorized access attempt");
      return NextResponse.json(
        { 
          success: false,
          error: "Unauthorized",
          message: "Please log in to access center statistics"
        }, 
        { status: 401 }
      );
    }

    console.log(`Centers stats API: Authorized access for user ${user.email} (${user.role})`);

    // Run all queries in parallel for efficiency
    const [
      totalResult,
      activeResult,
      inactiveResult,
      stateStatsResult,
      lgaStatsResult,
      recentActivityResult,
      recentInactiveResult,
    ] = await Promise.all([
      // Total centers
      db.select({ count: sql<number>`count(*)` }).from(centers),
      
      // Active centers
      db
        .select({ count: sql<number>`count(*)` })
        .from(centers)
        .where(eq(centers.isActive, true)),
      
      // Inactive centers
      db
        .select({ count: sql<number>`count(*)` })
        .from(centers)
        .where(eq(centers.isActive, false)),
      
      // Centers by state
      db
        .select({
          state: centers.state,
          count: sql<number>`count(*)`,
          active: sql<number>`sum(case when ${centers.isActive} then 1 else 0 end)`,
        })
        .from(centers)
        .groupBy(centers.state)
        .orderBy(desc(sql<number>`count(*)`)),
      
      // Centers by LGA (top 20)
      db
        .select({
          state: centers.state,
          lga: centers.lga,
          count: sql<number>`count(*)`,
          active: sql<number>`sum(case when ${centers.isActive} then 1 else 0 end)`,
        })
        .from(centers)
        .groupBy(centers.state, centers.lga)
        .orderBy(desc(sql<number>`count(*)`))
        .limit(20),
      
      // Recent activity (modified in last 7 days)
      db
        .select()
        .from(centers)
        .where(sql`${centers.modifiedAt} >= NOW() - INTERVAL '7 days'`)
        .orderBy(desc(centers.modifiedAt))
        .limit(10),
      
      // Recently inactivated centers
      db
        .select()
        .from(centers)
        .where(eq(centers.isActive, false))
        .orderBy(desc(centers.modifiedAt))
        .limit(10),
    ]);

    const total = totalResult[0]?.count || 0;
    const active = activeResult[0]?.count || 0;
    const inactive = inactiveResult[0]?.count || 0;
    const activePercentage = total > 0 ? Math.round((active / total) * 100) : 0;

    // Process state statistics
    const states = stateStatsResult.map(state => ({
      name: state.state,
      total: state.count,
      active: state.active,
      inactive: state.count - state.active,
    }));

    // Process LGA statistics
    const lgas = lgaStatsResult.map(lga => ({
      state: lga.state,
      name: lga.lga,
      total: lga.count,
      active: lga.active,
      inactive: lga.count - lga.active,
    }));

    // Process recent activity
    const recentActivity = recentActivityResult.map(center => ({
      id: center.id,
      number: center.number,
      name: center.name,
      state: center.state,
      lga: center.lga,
      isActive: center.isActive,
      modifiedAt: center.modifiedAt?.toISOString() || null,
      modifiedBy: center.modifiedBy,
    }));

    // Process recently inactivated centers
    const recentInactive = recentInactiveResult.map(center => ({
      id: center.id,
      number: center.number,
      name: center.name,
      state: center.state,
      lga: center.lga,
      inactivatedAt: center.modifiedAt?.toISOString() || null,
      inactivatedBy: center.modifiedBy,
    }));

    console.log(`Statistics loaded: ${total} total centers, ${active} active (${activePercentage}%)`);

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          total,
          active,
          inactive,
          activePercentage,
        },
        distribution: {
          byStatus: {
            active,
            inactive,
          },
          byState: states,
          byLGA: lgas,
        },
        recentActivity: {
          modifiedCenters: recentActivity,
          inactivatedCenters: recentInactive,
        },
      },
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
      },
      timestamp: new Date().toISOString(),
      cacheInfo: {
        cacheControl: "private, max-age=300",
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Centers stats error:", error);
    
    // Handle specific database errors
    if (error instanceof Error && error.message.includes("database")) {
      return NextResponse.json(
        { 
          success: false,
          error: "Database error",
          message: "Unable to retrieve statistics. Please try again later."
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { 
        success: false,
        error: "Failed to fetch center statistics",
        message: "An internal server error occurred while loading statistics",
        details: process.env.NODE_ENV === "development" && error instanceof Error 
          ? error.message 
          : undefined,
      },
      { status: 500 }
    );
  }
}

// Handle OPTIONS for CORS
export async function OPTIONS() {
  return NextResponse.json(
    {},
    {
      status: 200,
      headers: {
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization, Cookie",
        "Access-Control-Allow-Credentials": "true",
        "Access-Control-Max-Age": "86400",
      },
    }
  );
}