// src/app/api/auth/user/route.ts - ENHANCED VERSION
import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { db } from "@/lib/server/db/index";
import { adminSessions, admins } from "@/lib/server/db/schema";
import { eq, and } from "drizzle-orm";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "fallback-secret-change-in-production"
);

export async function GET(request: NextRequest) {
  console.log("GET /api/auth/user called");
  
  try {
    // Method 1: Check cookies from request
    const tokenFromCookie = request.cookies.get("auth-token")?.value;
    console.log("Token from cookie:", tokenFromCookie ? "PRESENT" : "MISSING");
    
    if (!tokenFromCookie) {
      // Also check Authorization header as fallback
      const authHeader = request.headers.get("authorization");
      console.log("Authorization header:", authHeader ? "PRESENT" : "MISSING");
      
      console.log("No user found - returning 401");
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    console.log("Token length:", tokenFromCookie.length);
    
    // Verify JWT
    const { payload } = await jwtVerify(tokenFromCookie, JWT_SECRET);
    console.log("JWT verified for user:", payload.email);
    
    // Check session in database
    const session = await db
      .select()
      .from(adminSessions)
      .where(
        and(
          eq(adminSessions.token, tokenFromCookie),
          eq(adminSessions.isActive, true),
          eq(adminSessions.adminId, payload.userId as string)
        )
      )
      .limit(1);

    console.log("Session found in DB:", session.length > 0);
    
    if (session.length === 0) {
      console.log("No active session found in database");
      return NextResponse.json(
        { error: "Session expired or invalid" },
        { status: 401 }
      );
    }

    // Get user details
    const [user] = await db
      .select({
        id: admins.id,
        email: admins.email,
        name: admins.name,
        role: admins.role,
        isEmailVerified: admins.isEmailVerified,
      })
      .from(admins)
      .where(eq(admins.id, payload.userId as string))
      .limit(1);

    if (!user) {
      console.log("User not found in database");
      return NextResponse.json(
        { error: "User not found" },
        { status: 401 }
      );
    }

    console.log("User found - returning user data");
    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
      }
    });

  } catch (error) {
    console.error("Error in /api/auth/user:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}