// src/app/api/centers/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/server/db/index";
import { centers, adminSchool, admins } from "@/lib/server/db/schema";
import { getUserFromCookies } from "@/lib/auth";
import { eq, or, ilike, and, desc, sql, SQL } from "drizzle-orm";

// Types for center data
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
  
  assignedAdmin?: {
    id: string;
    name: string;
  } | null;
  modifiedByName?: string;
  createdByName?: string;
}

// GET /api/centers
export async function GET(request: NextRequest) {
  try {
    // Get user from cookies using simplified auth
    const user = await getUserFromCookies(request);
    
    if (!user) {
      console.log("Centers API GET: Unauthorized access attempt");
      return NextResponse.json(
        { 
          success: false,
          error: "Unauthorized",
          message: "Please log in to access centers"
        }, 
        { status: 401 }
      );
    }

    console.log(`Centers API GET: Authorized access for user ${user.email} (${user.role})`);

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "10")));
    const search = searchParams.get("search") || "";
    const state = searchParams.get("state")?.trim();
    const lga = searchParams.get("lga")?.trim();
    const includeInactive = searchParams.get("includeInactive") === "true";
    const skip = (page - 1) * limit;

    // Build where conditions
    const whereConditions: SQL[] = [];
    
    // Add active filter if needed
    if (!includeInactive) {
      whereConditions.push(eq(centers.isActive, true));
    }
    

    // Add search filter if provided
if (search?.trim()) {
  const value = `%${search.trim().toLowerCase()}%`;

  const searchCondition = or(
    sql`lower(${centers.name}) LIKE ${value}`,
    sql`lower(${centers.number}) LIKE ${value}`,
    sql`lower(${centers.address}) LIKE ${value}`,
    sql`lower(${centers.state}) LIKE ${value}`,
    sql`lower(${centers.lga}) LIKE ${value}`,
  );

  if (searchCondition) {
    whereConditions.push(searchCondition);
  }
}
    
    // Add state filter if provided
    if (state) {
      whereConditions.push(eq(centers.state, state));
    }
    
    // Add LGA filter if provided
    if (lga) {
      whereConditions.push(eq(centers.lga, lga));
    }
    
    // Create final where condition
    const finalWhere = whereConditions.length > 0 
      ? and(...whereConditions) 
      : sql`1=1`;

    console.log(`Fetching centers - Page: ${page}, Limit: ${limit}, Search: "${search}", State: "${state || 'all'}", LGA: "${lga || 'all'}"`);

    // Get centers with admin information using joins instead of relations
    const centersQuery = db
      .select({
        id: centers.id,
        number: centers.number,
        name: centers.name,
        address: centers.address,
        state: centers.state,
        lga: centers.lga,
        isActive: centers.isActive,
        createdBy: centers.createdBy,
        modifiedBy: centers.modifiedBy,
        createdById: centers.createdById,
        modifiedById: centers.modifiedById,
        createdAt: centers.createdAt,
        modifiedAt: centers.modifiedAt,
        assignedAdminId: adminSchool.adminId,
        assignedAdminName: admins.name,
        createdByName: sql<string>`(SELECT name FROM admins WHERE admins.id = ${centers.createdById})`,
        modifiedByName: sql<string>`(SELECT name FROM admins WHERE admins.id = ${centers.modifiedById})`,
      })
      .from(centers)
      .leftJoin(
        adminSchool, 
        eq(centers.id, adminSchool.schoolId)
      )
      .leftJoin(
        admins, 
        eq(adminSchool.adminId, admins.id)
      )
      .leftJoin(
        admins, 
        eq(centers.createdById, admins.id)
      )
      .leftJoin(
        admins, 
        eq(centers.modifiedById, admins.id)
      )
      .where(finalWhere)
      .orderBy(desc(centers.modifiedAt))
      .limit(limit)
      .offset(skip);

    // Get total count
    const countQuery = db
      .select({ count: sql<number>`count(*)` })
      .from(centers)
      .where(finalWhere);

    const [centersData, totalResult] = await Promise.all([
      centersQuery,
      countQuery,
    ]);

    const total = Number(totalResult[0]?.count) || 0;
    const pages = Math.ceil(total / limit);

    // Transform the data to match our interface
    const transformedCenters: CenterWithAdminNames[] = centersData.map((center) => {
      const transformedCenter: CenterWithAdminNames = {
        id: center.id,
        number: center.number,
        name: center.name,
        address: center.address,
        state: center.state,
        lga: center.lga,
        isActive: center.isActive,
        createdBy: center.createdBy,
        modifiedBy: center.modifiedBy,
        createdById: center.createdById,
        modifiedById: center.modifiedById,
        createdAt: center.createdAt,
        modifiedAt: center.modifiedAt,
        createdByName: center.createdByName,
        modifiedByName: center.modifiedByName,
      };

      // Add assigned admin if exists
      if (center.assignedAdminId) {
        transformedCenter.assignedAdmin = {
          id: center.assignedAdminId,
          name: center.assignedAdminName || "Unknown",
        };
      }

      return transformedCenter;
    });

    console.log(`Fetched ${transformedCenters.length} centers (Total: ${total})`);

    return NextResponse.json({
      success: true,
      data: {
        centers: transformedCenters,
        pagination: { 
          page, 
          limit, 
          total, 
          pages,
          hasNextPage: page < pages,
          hasPreviousPage: page > 1,
        },
        filters: {
          search,
          state: state || null,
          lga: lga || null,
          includeInactive,
        },
      },
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Centers GET API error:", error);
    
    // Handle specific database errors
    if (error instanceof Error && error.message.includes("database")) {
      return NextResponse.json(
        { 
          success: false,
          error: "Database error",
          message: "Unable to retrieve centers. Please try again later."
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { 
        success: false,
        error: "Failed to fetch centers",
        message: "An internal server error occurred while loading centers",
        details: process.env.NODE_ENV === "development" && error instanceof Error 
          ? error.message 
          : undefined,
      },
      { status: 500 }
    );
  }
}

// Helper function to generate center number per state/LGA (1-999)
async function generateCenterNumber(state: string, lga: string): Promise<string> {
  try {
    // Clean and validate inputs
    const cleanState = state.trim().replace(/[^a-zA-Z\s]/g, '').slice(0, 50);
    const cleanLga = lga.trim().replace(/[^a-zA-Z\s]/g, '').slice(0, 50);

    if (!cleanState || !cleanLga) {
      throw new Error("Invalid state or LGA provided");
    }

    // Extract first two letters of state and convert to uppercase
    const stateCode = cleanState.length >= 2
      ? cleanState.substring(0, 2).toUpperCase()
      : cleanState.padEnd(2, "X").toUpperCase();

    // Extract first two letters of LGA and convert to uppercase
    const lgaCode = cleanLga.length >= 2
      ? cleanLga.substring(0, 2).toUpperCase()
      : cleanLga.padEnd(2, "X").toUpperCase();

    const prefix = `${stateCode}${lgaCode}`;

    console.log(`Generating center number for ${cleanState}, ${cleanLga} - Prefix: ${prefix}`);

    // Find the maximum sequence number for this specific state and LGA combination
    const [maxResult] = await db
      .select({
        maxSequence: sql<number>`MAX(CAST(SUBSTRING(${centers.number}, 5, 3) AS INTEGER))`,
      })
      .from(centers)
      .where(
        and(
          eq(centers.state, cleanState),
          eq(centers.lga, cleanLga),
          sql`${centers.number} LIKE ${`${prefix}%`}`
        )
      );

    // Determine the next sequence number
    const currentMax = maxResult?.maxSequence || 0;
    const nextSequence = currentMax + 1;

    // Ensure we don't exceed 999
    if (nextSequence > 999) {
      throw new Error(
        `Maximum number of centers (999) reached for ${cleanState}, ${cleanLga}. Please contact support.`
      );
    }

    // Format the sequence number as 3 digits
    const sequenceNumber = nextSequence.toString().padStart(3, "0");
    const centerNumber = `${prefix}${sequenceNumber}`;

    console.log(`Generated center number: ${centerNumber} (Sequence: ${nextSequence})`);

    return centerNumber;
  } catch (error) {
    console.error("Error generating center number:", error);
    throw error;
  }
}

// POST /api/centers
export async function POST(request: NextRequest) {
  try {
    // Get user from cookies using simplified auth
    const user = await getUserFromCookies(request);
    
    if (!user) {
      console.log("Centers API POST: Unauthorized access attempt");
      return NextResponse.json(
        { 
          success: false,
          error: "Unauthorized",
          message: "Please log in to create centers"
        }, 
        { status: 401 }
      );
    }

    // Check if user has permission to create centers
    if (user.role !== 'admin' && user.role !== 'superadmin') {
      return NextResponse.json(
        { 
          success: false,
          error: "Forbidden",
          message: "You do not have permission to create centers"
        }, 
        { status: 403 }
      );
    }

    console.log(`Centers API POST: Authorized access for user ${user.email} (${user.role})`);

    const body = await request.json();
    const { name, address, state, lga, isActive = true } = body;

    // Validate required fields
    const validationErrors: string[] = [];
    
    if (!name || name.trim().length < 2) {
      validationErrors.push("Center name must be at least 2 characters");
    }
    
    if (!address || address.trim().length < 5) {
      validationErrors.push("Address must be at least 5 characters");
    }
    
    if (!state || state.trim().length < 2) {
      validationErrors.push("State must be at least 2 characters");
    }
    
    if (!lga || lga.trim().length < 2) {
      validationErrors.push("LGA must be at least 2 characters");
    }
    
    if (validationErrors.length > 0) {
      return NextResponse.json(
        { 
          success: false,
          error: "Validation failed",
          message: "Please correct the following errors",
          errors: validationErrors
        },
        { status: 400 }
      );
    }

    // Clean inputs
    const cleanName = name.trim();
    const cleanAddress = address.trim();
    const cleanState = state.trim();
    const cleanLga = lga.trim();

    // Check for duplicate center by name, state, and LGA
    const [existingCenter] = await db
      .select()
      .from(centers)
      .where(
        and(
          eq(centers.name, cleanName),
          eq(centers.state, cleanState),
          eq(centers.lga, cleanLga)
        )
      )
      .limit(1);

    if (existingCenter) {
      return NextResponse.json(
        { 
          success: false,
          error: "Duplicate center",
          message: `A center named "${cleanName}" already exists in ${cleanState}, ${cleanLga}`
        },
        { status: 409 }
      );
    }

    // Generate center number per state/LGA (1-999)
    const centerNumber = await generateCenterNumber(cleanState, cleanLga);

    console.log(`Creating new center: ${cleanName} in ${cleanState}, ${cleanLga} - Number: ${centerNumber}`);

    // Use a transaction to create both the center and the admin-school relationship
    const result = await db.transaction(async (tx) => {
      // Create the center
      const [center] = await tx
        .insert(centers)
        .values({
          number: centerNumber,
          name: cleanName,
          address: cleanAddress,
          state: cleanState,
          lga: cleanLga,
          isActive,
          createdBy: user.name || user.email,
          modifiedBy: user.name || user.email,
          createdById: user.id,
          modifiedById: user.id,
          createdAt: new Date(),
          modifiedAt: new Date(),
        })
        .returning();

      if (!center) {
        throw new Error("Failed to create center");
      }

      // Create the admin-school relationship
      await tx.insert(adminSchool).values({
        adminId: user.id,
        schoolId: center.id,
      });

      console.log(`Center created successfully: ${center.id}`);

      return center;
    });

    // Get the center with admin information
    const [centerWithAdmin] = await db
      .select({
        id: centers.id,
        number: centers.number,
        name: centers.name,
        address: centers.address,
        state: centers.state,
        lga: centers.lga,
        isActive: centers.isActive,
        createdBy: centers.createdBy,
        modifiedBy: centers.modifiedBy,
        createdById: centers.createdById,
        modifiedById: centers.modifiedById,
        createdAt: centers.createdAt,
        modifiedAt: centers.modifiedAt,
        assignedAdminId: adminSchool.adminId,
        assignedAdminName: admins.name,
      })
      .from(centers)
      .leftJoin(adminSchool, eq(centers.id, adminSchool.schoolId))
      .leftJoin(admins, eq(adminSchool.adminId, admins.id))
      .where(eq(centers.id, result.id))
      .limit(1);

    const centerWithAdminNames: CenterWithAdminNames = {
      ...result,
      createdByName: user.name || user.email,
      modifiedByName: user.name || user.email,
    };

    // Add assigned admin if exists
    if (centerWithAdmin?.assignedAdminId) {
      centerWithAdminNames.assignedAdmin = {
        id: centerWithAdmin.assignedAdminId,
        name: centerWithAdmin.assignedAdminName || "Unknown",
      };
    }

    console.log(`Center ${result.id} created successfully by ${user.email}`);

    return NextResponse.json({
      success: true,
      message: "Center created successfully",
      data: centerWithAdminNames,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
      },
      timestamp: new Date().toISOString(),
    }, { status: 201 });
  } catch (error) {
    console.error("Centers POST API error:", error);
    
    // Handle specific error for exceeding maximum centers
    if (error instanceof Error && error.message.includes("Maximum number of centers")) {
      return NextResponse.json(
        { 
          success: false,
          error: "Maximum limit reached",
          message: error.message
        }, 
        { status: 400 }
      );
    }

    // Handle JSON parsing errors
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { 
          success: false,
          error: "Invalid JSON",
          message: "The request body contains invalid JSON"
        },
        { status: 400 }
      );
    }

    // Handle database transaction errors
    if (error instanceof Error && error.message.includes("transaction")) {
      return NextResponse.json(
        { 
          success: false,
          error: "Transaction failed",
          message: "The center creation failed due to a database transaction error"
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { 
        success: false,
        error: "Failed to create center",
        message: "An internal server error occurred while creating the center",
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
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization, Cookie",
        "Access-Control-Allow-Credentials": "true",
        "Access-Control-Max-Age": "86400",
      },
    }
  );
}