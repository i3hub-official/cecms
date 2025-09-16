// src/app/api/centers/count/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/server/db/index";
import { centers } from "@/lib/server/db/schema";
import { validateSession } from "@/lib/auth";
import { eq, and, ilike } from "drizzle-orm";
import { sql } from "drizzle-orm";

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const authResult = await validateSession(request);
    if (!authResult.isValid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const state = url.searchParams.get("state")?.trim();
    const lga = url.searchParams.get("lga")?.trim();

    if (!state || !lga) {
      return NextResponse.json(
        { error: "State and LGA are required" },
        { status: 400 }
      );
    }

       // Count centers with the specified state, LGA, and active status
    const [result] = await db
      .select({ count: sql<number>`count(*)` })
      .from(centers)
      .where(
        and(
          ilike(centers.state, state),
          ilike(centers.lga, lga),
          eq(centers.isActive, true)
        )
      );

    return NextResponse.json({ count: result?.count || 0 });
  } catch (error) {
    console.error(
      "Count centers error:",
      error instanceof Error ? error.message : error
    );
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
