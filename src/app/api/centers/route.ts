// src/app/api/centers/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/server/db/index";
import { centers } from "@/lib/server/db/schema";
import { validateSession } from "@/lib/auth";
import { eq, or, ilike, and, sql } from "drizzle-orm";

// GET /api/centers - fetch centers with optional search and pagination
export async function GET(request: NextRequest) {
  try {
    const authResult = await validateSession(request);
    if (!authResult.isValid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";
    const includeInactive = searchParams.get("includeInactive") === "true";
    const skip = (page - 1) * limit;

    // Build where conditions
    const whereConditions: Array<
      ReturnType<typeof eq> | ReturnType<typeof or>
    > = [];

    if (!includeInactive) {
      whereConditions.push(eq(centers.isActive, true));
    }

    if (search) {
      const searchCondition = or(
        ilike(centers.name, `%${search}%`),
        ilike(centers.number, `%${search}%`),
        ilike(centers.address, `%${search}%`),
        ilike(centers.state, `%${search}%`),
        ilike(centers.lga, `%${search}%`)
      );
      whereConditions.push(searchCondition);
    }

    // Combine all conditions with AND
    const finalWhere =
      whereConditions.length > 0 ? and(...whereConditions) : undefined;

    // Fetch centers and total count
    const [centersData, totalResult] = await Promise.all([
      db
        .select()
        .from(centers)
        .where(finalWhere)
        .orderBy(centers.modifiedAt)
        .limit(limit)
        .offset(skip),
      db
        .select({ count: sql<number>`count(*)` })
        .from(centers)
        .where(finalWhere),
    ]);

    const total = totalResult[0]?.count || 0;
    const pages = Math.ceil(total / limit);

    return NextResponse.json({
      centers: centersData,
      pagination: { page, limit, total, pages },
    });
  } catch (error) {
    console.error("Centers GET API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch centers" },
      { status: 500 }
    );
  }
}

// POST /api/centers - create a new center
export async function POST(request: NextRequest) {
  try {
    const authResult = await validateSession(request);
    if (!authResult.isValid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: {
      number: string;
      name: string;
      address: string;
      state: string;
      lga: string;
      isActive?: boolean;
    } = await request.json();

    const { number, name, address, state, lga, isActive = true } = body;

    // Check if the center number already exists
    const [existingCenter] = await db
      .select()
      .from(centers)
      .where(eq(centers.number, number))
      .limit(1);

    if (existingCenter) {
      return NextResponse.json(
        { error: "Center number already exists" },
        { status: 400 }
      );
    }

    // Create center
    const [center] = await db
      .insert(centers)
      .values({
        number,
        name,
        address,
        state,
        lga,
        isActive,
        createdBy: authResult.user?.name || "system",
        modifiedBy: authResult.user?.name || "system",
        createdAt: new Date(),
        modifiedAt: new Date(),
      })
      .returning();

    return NextResponse.json(center);
  } catch (error) {
    console.error("Centers POST API error:", error);
    return NextResponse.json(
      { error: "Failed to create center" },
      { status: 500 }
    );
  }
}
