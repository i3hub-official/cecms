// src/app/api/centers/route.ts
import { NextRequest, NextResponse } from "next/server";

// Define the CenterWithAdminNames type
interface CenterWithAdminNames {
  id: string;
  number: string;
  name: string;
  address: string;
  state: string;
  lga: string;
  isActive: boolean;
  createdBy: string;
  modifiedBy: string | null;
  createdById: string;
  modifiedById: string;
  createdAt: Date;
  modifiedAt: Date | null;
  modifiedByName: string;
  createdByName: string;
}
import { db } from "@/lib/server/db/index";
import { centers } from "@/lib/server/db/schema";
import { validateSession } from "@/lib/auth";
import { eq, or, ilike, and, sql, desc, SQL } from "drizzle-orm";

// GET /api/centers - fetch centers with optional search and pagination
export async function GET(request: NextRequest) {
  try {
    const authResult = await validateSession(request);
    if (!authResult.isValid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "10")));
    const search = searchParams.get("search") || "";
    const includeInactive = searchParams.get("includeInactive") === "true";
    const skip = (page - 1) * limit;

    // Build where conditions
    const whereConditions: SQL[] = [];

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
      if (searchCondition) {
        whereConditions.push(searchCondition);
      }
    }

    // Combine all conditions with AND
    const finalWhere = whereConditions.length > 0 ? and(...whereConditions) : undefined;

    // Use Drizzle's relational query with with()
    const centersData = await db.query.centers.findMany({
      where: finalWhere,
      orderBy: desc(centers.modifiedAt),
      limit: limit,
      offset: skip,
      with: {
        modifiedByAdmin: {
          columns: {
            id: true,
            name: true,
          },
        },
        createdByAdmin: {
          columns: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Get total count
    const totalResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(centers)
      .where(finalWhere);

    const total = totalResult[0]?.count || 0;
    const pages = Math.ceil(total / limit);

    // Transform the data to include admin names
    const transformedCenters = centersData.map(center => ({
      ...center,
      modifiedByName: center.modifiedByAdmin?.name || "Unknown",
      createdByName: center.createdByAdmin?.name || "Unknown",
      // Remove the relation objects if you don't want them in the response
      modifiedByAdmin: undefined,
      createdByAdmin: undefined,
    }));

    // Use type assertion if needed, but TypeScript should infer this correctly
    return NextResponse.json({
      centers: transformedCenters,
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

    // Validate required fields
    if (!number || !name || !address || !state || !lga) {
      return NextResponse.json(
        { error: "All fields are required: number, name, address, state, lga" },
        { status: 400 }
      );
    }

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
        createdById: authResult.user?.id || "system",
        modifiedById: authResult.user?.id || "system",
        createdAt: new Date(),
        modifiedAt: new Date(),
      })
      .returning();

    // Use relational query to get the center with admin info
    const centerWithRelations = await db.query.centers.findFirst({
      where: eq(centers.id, center.id),
      with: {
        modifiedByAdmin: {
          columns: {
            name: true,
          },
        },
        createdByAdmin: {
          columns: {
            name: true,
          },
        },
      },
    });

    // Return center with admin names
    const centerWithAdminNames: CenterWithAdminNames = {
      ...center,
      modifiedByName: centerWithRelations?.modifiedByAdmin?.name || "system",
      createdByName: centerWithRelations?.createdByAdmin?.name || "system",
    };

    return NextResponse.json(centerWithAdminNames, { status: 201 });

  } catch (error) {
    console.error("Centers POST API error:", error);
    return NextResponse.json(
      { error: "Failed to create center" },
      { status: 500 }
    );
  }
}