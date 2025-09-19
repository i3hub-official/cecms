// src/app/apis/v1/center-lookup/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/server/db/index";
import { centers } from "@/lib/server/db/schema";
import { eq, ilike, and } from "drizzle-orm";
import { authenticateRequest } from "@/lib/middleware/withAuth";

export async function GET(request: NextRequest) {
  // Authenticate the request
  const authResult = await authenticateRequest(request);

  if (!authResult.success) {
    return NextResponse.json(
      { error: authResult.error },
      { status: authResult.status || 401 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const number = searchParams.get("number");

    if (!number) {
      return NextResponse.json(
        { error: "Center number is required" },
        { status: 400 }
      );
    }

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
