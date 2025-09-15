// src/app/api/centers-lookup/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/server/db/index";
import { centers } from "@/lib/server/db/schema";
import { eq, ilike, and } from "drizzle-orm";
import { sql } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const number = searchParams.get("number");

    if (!number) {
      return NextResponse.json(
        { error: "Center number is required" },
        { status: 400 }
      );
    }

    // Using ilike for case-insensitive search (PostgreSQL specific)
    const [center] = await db
      .select({
        id: centers.id,
        number: centers.number,
        name: centers.name,
        address: centers.address,
        state: centers.state,
        lga: centers.lga,
        isActive: centers.isActive,
      })
      .from(centers)
      .where(and(ilike(centers.number, number), eq(centers.isActive, true)))
      .limit(1);

    // Alternative approach using SQL expression for case-insensitive comparison
    // if ilike doesn't work as expected:
    // .where(
    //   and(
    //     sql`LOWER(${centers.number}) = LOWER(${number})`,
    //     eq(centers.isActive, true)
    //   )
    // )

    if (!center) {
      return NextResponse.json({ error: "Center not found" }, { status: 404 });
    }

    return NextResponse.json(center);
  } catch (error) {
    console.error("Center lookup error:", error);
    return NextResponse.json(
      { error: "Failed to lookup center" },
      { status: 500 }
    );
  }
}
