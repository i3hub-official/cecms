// src/app/api/centers/count/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/server/db/index";
import { centers, admins, adminSessions } from "@/lib/server/db/schema";
import { eq, and, ilike, sql } from "drizzle-orm";
import { jwtVerify } from "jose";

// JWT configuration
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "fallback-secret-change-in-production"
);

// Helper function to verify auth token (same as /api/auth/user)
async function verifyAuthToken(request: NextRequest) {
  try {
    // Method 1: Check cookies from request
    const tokenFromCookie = request.cookies.get("auth-token")?.value;
    
    if (!tokenFromCookie) {
      // Also check Authorization header as fallback
      const authHeader = request.headers.get("authorization");
      if (authHeader?.startsWith("Bearer ")) {
        const token = authHeader.substring(7);
        return await verifyToken(token);
      }
      return null;
    }

    return await verifyToken(tokenFromCookie);
  } catch (error) {
    console.error("Auth verification error:", error);
    return null;
  }
}

async function verifyToken(token: string) {
  try {
    // Verify JWT
    const { payload } = await jwtVerify(token, JWT_SECRET);
    
    // Check session in database
    const session = await db
      .select()
      .from(adminSessions)
      .where(
        and(
          eq(adminSessions.token, token),
          eq(adminSessions.isActive, true),
          eq(adminSessions.adminId, payload.userId as string)
        )
      )
      .limit(1);

    if (session.length === 0) {
      console.log("No active session found in database");
      return null;
    }

    // Get user details
    const [user] = await db
      .select({
        id: admins.id,
        email: admins.email,
        name: admins.name,
        role: admins.role,
        isEmailVerified: admins.isEmailVerified,
        isActive: admins.isActive,
      })
      .from(admins)
      .where(eq(admins.id, payload.userId as string))
      .limit(1);

    if (!user || !user.isActive) {
      console.log("User not found or inactive");
      return null;
    }

    // Update session last used time
    await db
      .update(adminSessions)
      .set({ lastUsed: new Date() })
      .where(eq(adminSessions.id, session[0].id));

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      isEmailVerified: user.isEmailVerified,
    };
  } catch (error) {
    console.error("Token verification error:", error);
    return null;
  }
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // Verify authentication
    const user = await verifyAuthToken(request);
    
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