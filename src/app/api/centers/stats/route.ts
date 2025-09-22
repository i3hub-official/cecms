// src/app/api/centers/stats/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/server/db/index";
import { centers } from "@/lib/server/db/schema";
import { getUserFromCookies } from "@/lib/auth";
import { eq, desc, sql } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromCookies(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Run all queries in parallel for efficiency
    const [
      totalResult,
      activeResult,
      inactiveResult,
      inactiveCenters,
      recentActivity,
    ] = await Promise.all([
      db.select({ count: sql<number>`count(*)` }).from(centers),
      db
        .select({ count: sql<number>`count(*)` })
        .from(centers)
        .where(eq(centers.isActive, true)),
      db
        .select({ count: sql<number>`count(*)` })
        .from(centers)
        .where(eq(centers.isActive, false)),
      db
        .select()
        .from(centers)
        .where(eq(centers.isActive, false))
        .orderBy(desc(centers.modifiedAt))
        .limit(10),
      db
        .select()
        .from(centers)
        .orderBy(desc(centers.modifiedAt))
        .limit(10),
    ]);

    const total = totalResult[0]?.count || 0;
    const active = activeResult[0]?.count || 0;
    const inactive = inactiveResult[0]?.count || 0;

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
