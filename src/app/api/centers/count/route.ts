// src/app/api/centers/count/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/server/db/index";
import { centers } from "@/lib/server/db/schema";
import { getUserFromCookies } from "@/lib/auth";
import { eq, and, ilike, sql } from "drizzle-orm";

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // Get user from cookies using the simplified auth
    const user = await getUserFromCookies(request);
    
    if (!user) {
      console.log("Centers count API: Unauthorized access attempt");
      return NextResponse.json(
        { 
          success: false,
          error: "Unauthorized",
          message: "Please log in to access center counts"
        }, 
        { status: 401 }
      );
    }

    console.log(`Centers count API: Authorized access for user ${user.email} (${user.role})`);

    const url = new URL(request.url);
    const state = url.searchParams.get("state")?.trim();
    const lga = url.searchParams.get("lga")?.trim();

    // Validate parameters
    if (!state) {
      return NextResponse.json(
        { 
          success: false,
          error: "Missing parameter",
          message: "State parameter is required"
        },
        { status: 400 }
      );
    }

    if (!lga) {
      return NextResponse.json(
        { 
          success: false,
          error: "Missing parameter",
          message: "LGA parameter is required"
        },
        { status: 400 }
      );
    }

    // Clean and validate input
    const cleanState = state.replace(/[^\w\s-]/gi, '').slice(0, 100);
    const cleanLGA = lga.replace(/[^\w\s-]/gi, '').slice(0, 100);

    if (!cleanState || cleanState.length < 2) {
      return NextResponse.json(
        { 
          success: false,
          error: "Invalid parameter",
          message: "State must be at least 2 characters long"
        },
        { status: 400 }
      );
    }

    if (!cleanLGA || cleanLGA.length < 2) {
      return NextResponse.json(
        { 
          success: false,
          error: "Invalid parameter",
          message: "LGA must be at least 2 characters long"
        },
        { status: 400 }
      );
    }

    console.log(`Counting centers for state: ${cleanState}, LGA: ${cleanLGA}`);

    // Count centers with the specified state, LGA, and active status
    const [result] = await db
      .select({ count: sql<number>`count(*)` })
      .from(centers)
      .where(
        and(
          ilike(centers.state, cleanState),
          ilike(centers.lga, cleanLGA),
          eq(centers.isActive, true)
        )
      );

    const count = result?.count || 0;
    
    console.log(`Found ${count} active centers in ${cleanState}, ${cleanLGA}`);

    return NextResponse.json({
      success: true,
      data: {
        count,
        state: cleanState,
        lga: cleanLGA,
        isActive: true,
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
    console.error(
      "Count centers error:",
      error instanceof Error ? error.message : error
    );
    
    // Handle specific database errors
    if (error instanceof Error && error.message.includes("database")) {
      return NextResponse.json(
        { 
          success: false,
          error: "Database error",
          message: "Unable to retrieve center count. Please try again later."
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { 
        success: false,
        error: "Internal server error",
        message: "An unexpected error occurred while counting centers"
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
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization, Cookie",
        "Access-Control-Allow-Credentials": "true",
        "Access-Control-Max-Age": "86400",
      },
    }
  );
}