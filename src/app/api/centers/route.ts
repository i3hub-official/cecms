// src/app/api/centers/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/server/db/index";
import { centers } from "@/lib/server/db/schema";
import { getUserFromCookies } from "@/lib/auth";
import { eq, or, ilike, and, sql, desc, SQL } from "drizzle-orm";

// Center type including admin names
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
      whereConditions.push(
        or(
          ilike(centers.name, `%${search}%`),
          ilike(centers.number, `%${search}%`),
          ilike(centers.address, `%${search}%`),
          ilike(centers.state, `%${search}%`),
          ilike(centers.lga, `%${search}%`)
        ) || sql`false`
      );
    }
    const finalWhere = whereConditions.length ? and(...whereConditions) : sql`true`;

    const [centersData, totalResult] = await Promise.all([
      db.query.centers.findMany({
        where: finalWhere || sql`true`,
        orderBy: desc(centers.modifiedAt),
        limit,
        offset: skip,
        with: {
          modifiedByAdmin: { columns: { id: true, name: true } },
          createdByAdmin: { columns: { id: true, name: true } },
        },
      }),
      db
        .select({ count: sql<number>`count(*)` })
        .from(centers)
        .where(finalWhere || sql`true`),
    ]);

    const total = totalResult[0]?.count || 0;
    const pages = Math.ceil(total / limit);

    const transformedCenters: CenterWithAdminNames[] = centersData.map(
      (center) => ({
        ...center,
        modifiedByName: center.modifiedByAdmin?.name || "Unknown",
        createdByName: center.createdByAdmin?.name || "Unknown",
        modifiedByAdmin: undefined,
        createdByAdmin: undefined,
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

// POST /api/centers
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromCookies(request);
    if (!user) {
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

    if (!number || !name || !address || !state || !lga) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

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

    const [center] = await db
      .insert(centers)
      .values({
        number,
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

    const centerWithRelations = await db.query.centers.findFirst({
      where: eq(centers.id, center.id),
      with: {
        modifiedByAdmin: { columns: { name: true } },
        createdByAdmin: { columns: { name: true } },
      },
    });

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
