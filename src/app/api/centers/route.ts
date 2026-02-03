// src/app/api/centers/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/server/db/index";
import { centers, adminSchool, admins } from "@/lib/server/db/schema";
import { getUserFromCookies } from "@/lib/auth";
import { eq, or, ilike, and, sql, desc, SQL } from "drizzle-orm";

// Center type including admin names and assigned admin
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
  
  assignedAdmin?: {
    id: string;
    name: string;
  } | null;
}

// GET /api/centers
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromCookies(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(
      50,
      Math.max(1, parseInt(searchParams.get("limit") || "10"))
    );
    const search = searchParams.get("search") || "";
    const includeInactive = searchParams.get("includeInactive") === "true";
    const skip = (page - 1) * limit;

    const whereConditions: SQL[] = [];
    if (!includeInactive) whereConditions.push(eq(centers.isActive, true));
    if (search) {
      const searchPattern = `%${search}%`;
      whereConditions.push(
        or(
          ilike(centers.name, searchPattern),
          ilike(centers.number, searchPattern),
          ilike(centers.address, searchPattern),
          ilike(centers.state, searchPattern),
          ilike(centers.lga, searchPattern)
        )
      );
    }
    
    const finalWhere = whereConditions.length > 0 
      ? and(...whereConditions) 
      : undefined;

    const [centersData, totalResult] = await Promise.all([
      db.query.centers.findMany({
        where: finalWhere || undefined,
        orderBy: desc(centers.modifiedAt),
        limit,
        offset: skip,
        with: {
          adminSchool: {
            with: {
              admin: {
                columns: { id: true, name: true },
              },
            },
          },
          modifiedByAdmin: { columns: { id: true, name: true } },
          createdByAdmin: { columns: { id: true, name: true } },
        },
      }),
      db
        .select({ count: sql<number>`count(*)` })
        .from(centers)
        .where(finalWhere || sql`true`),
    ]);

    const total = Number(totalResult[0]?.count) || 0;
    const pages = Math.ceil(total / limit);

    const transformedCenters: CenterWithAdminNames[] = centersData.map(
      (center) => ({
        ...center,
        assignedAdmin: center.adminSchool?.admin || null,
        modifiedByName: center.modifiedByAdmin?.name || "Unknown",
        createdByName: center.createdByAdmin?.name || "Unknown",
      })
    );

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

// Helper function to generate center number per state/LGA (1-999)
async function generateCenterNumber(
  state: string,
  lga: string
): Promise<string> {
  // Extract first two letters of state and convert to uppercase
  const stateCode =
    state.length >= 2
      ? state.substring(0, 2).toUpperCase()
      : state.padEnd(2, "X").toUpperCase();

  // Extract first two letters of LGA and convert to uppercase
  const lgaCode =
    lga.length >= 2
      ? lga.substring(0, 2).toUpperCase()
      : lga.padEnd(2, "X").toUpperCase();

  const prefix = `${stateCode}${lgaCode}`;

  // Find the maximum sequence number for this specific state and LGA combination
  const [maxResult] = await db
    .select({
      maxSequence: sql<number>`MAX(CAST(SUBSTRING(${centers.number}, 5, 3) AS INTEGER))`,
    })
    .from(centers)
    .where(
      and(
        eq(centers.state, state),
        eq(centers.lga, lga),
        sql`${centers.number} LIKE ${`${prefix}%`}`
      )
    );

  // Determine the next sequence number
  const nextSequence = (maxResult?.maxSequence || 0) + 1;

  // Ensure we don't exceed 999
  if (nextSequence > 999) {
    throw new Error(
      `Maximum number of centers (999) reached for ${state}, ${lga}`
    );
  }

  // Format the sequence number as 3 digits
  const sequenceNumber = nextSequence.toString().padStart(3, "0");

  return `${prefix}${sequenceNumber}`;
}

// POST /api/centers
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromCookies(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, address, state, lga, isActive = true } = body;

    if (!name || !address || !state || !lga) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    // Check for duplicate center by name, state, and LGA
    const [existingCenter] = await db
      .select()
      .from(centers)
      .where(
        and(
          eq(centers.name, name),
          eq(centers.state, state),
          eq(centers.lga, lga)
        )
      )
      .limit(1);

    if (existingCenter) {
      return NextResponse.json(
        { error: "A center with this name, state, and LGA already exists" },
        { status: 400 }
      );
    }

    // Generate center number per state/LGA (1-999)
    const centerNumber = await generateCenterNumber(state, lga);

    // Use a transaction to create both the center and the admin-school relationship
    const result = await db.transaction(async (tx) => {
      // Create the center
      const [center] = await tx
        .insert(centers)
        .values({
          number: centerNumber,
          name,
          address,
          state,
          lga,
          isActive,
          createdBy: user.name || "system",
          modifiedBy: user.name || "system",
          createdById: user.id,
          modifiedById: user.id,
          createdAt: new Date(),
          modifiedAt: new Date(),
        })
        .returning();

      // Create the admin-school relationship
      await tx.insert(adminSchool).values({
        adminId: user.id,
        schoolId: center.id,
      });

      return center;
    });

    // Get the center with all relations
    const centerWithRelations = await db.query.centers.findFirst({
      where: eq(centers.id, result.id),
      with: {
        adminSchool: {
          with: {
            admin: {
              columns: { id: true, name: true },
            },
          },
        },
        modifiedByAdmin: { columns: { name: true } },
        createdByAdmin: { columns: { name: true } },
      },
    });

    const centerWithAdminNames: CenterWithAdminNames = {
      ...result,
      assignedAdmin: centerWithRelations?.adminSchool?.admin || null,
      modifiedByName: centerWithRelations?.modifiedByAdmin?.name || "system",
      createdByName: centerWithRelations?.createdByAdmin?.name || "system",
    };

    return NextResponse.json(centerWithAdminNames, { status: 201 });
  } catch (error) {
    console.error("Centers POST API error:", error);

    // Handle specific error for exceeding maximum centers
    if (
      error instanceof Error &&
      error.message.includes("Maximum number of centers")
    ) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Failed to create center" },
      { status: 500 }
    );
  }
}