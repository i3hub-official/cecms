// src/app/api/centers/stats/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/server/db/index";
import { centers } from "@/lib/server/db/schema";
import { validateSession } from "@/lib/auth";
import { eq, desc } from "drizzle-orm";
import { sql } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const authResult = await validateSession(request);
    if (!authResult.isValid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Execute all queries in parallel
    const [
      totalResult,
      activeResult,
      inactiveResult,
      inactiveCenters,
      recentActivity,
    ] = await Promise.all([
      // Total count
      db.select({ count: sql<number>`count(*)` }).from(centers),

      // Active count
      db
        .select({ count: sql<number>`count(*)` })
        .from(centers)
        .where(eq(centers.isActive, true)),

      // Inactive count
      db
        .select({ count: sql<number>`count(*)` })
        .from(centers)
        .where(eq(centers.isActive, false)),

      // Inactive centers (latest 10)
      db
        .select()
        .from(centers)
        .where(eq(centers.isActive, false))
        .orderBy(desc(centers.modifiedAt))
        .limit(10),

      // Recent activity (latest 10)
      db.select().from(centers).orderBy(desc(centers.modifiedAt)).limit(10),
    ]);

    // Extract counts from results
    const total = totalResult[0]?.count || 0;
    const active = activeResult[0]?.count || 0;
    const inactive = inactiveResult[0]?.count || 0;

    // Alternative count approach (if available)
    // const total = await db.$count(centers);
    // const active = await db.$count(centers, eq(centers.isActive, true));
    // const inactive = await db.$count(centers, eq(centers.isActive, false));

    return NextResponse.json({
      total,
      active,
      inactive,
      inactiveCenters,
      recentActivity,
    });
  } catch (error) {
    console.error("Centers stats error:", error);
    return NextResponse.json(
      { error: "Failed to fetch center statistics" },
      { status: 500 }
    );
  }
}
