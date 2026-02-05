// src/app/api/dashboard/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/server/db/index";
import {
  centers,
  admins,
  adminSessions,
  passwordResets,
} from "@/lib/server/db/schema";
import { eq, and, or, gte, lte, gt, desc } from "drizzle-orm";
import { sql } from "drizzle-orm";
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

// GET /api/dashboard - Get dashboard statistics
export async function GET(request: NextRequest) {
  try {
    // Get current admin from auth token (same as /api/auth/user)
    const authUser = await verifyAuthToken(request);
    
    if (!authUser) {
      console.log("Dashboard API: Unauthorized access attempt");
      return NextResponse.json(
        { 
          success: false, 
          error: "Unauthorized",
          message: "Please log in to access dashboard data"
        },
        { status: 401 }
      );
    }

    console.log(`Dashboard API: Authorized access for user ${authUser.email} (${authUser.role})`);

    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Get all statistics in parallel
    const [
      totalCentersResult,
      activeCentersResult,
      inactiveCentersResult,
      recentlyCreatedCentersResult,
      recentlyModifiedCentersResult,
      totalAdminsResult,
      activeAdminsResult,
      inactiveAdminsResult,
      activeSessionsResult,
      totalSessionsResult,
      expiredSessionsResult,
      pendingResetsResult,
      usedResetsResult,
      expiredResetsResult,
      recentCentersData,
      activeSessionsDetailedData,
    ] = await Promise.all([
      // Center counts
      db.select({ count: sql<number>`count(*)` }).from(centers),
      db
        .select({ count: sql<number>`count(*)` })
        .from(centers)
        .where(eq(centers.isActive, true)),
      db
        .select({ count: sql<number>`count(*)` })
        .from(centers)
        .where(eq(centers.isActive, false)),
      db
        .select({ count: sql<number>`count(*)` })
        .from(centers)
        .where(gte(centers.createdAt, sevenDaysAgo)),
      db
        .select({ count: sql<number>`count(*)` })
        .from(centers)
        .where(gte(centers.modifiedAt, sevenDaysAgo)),

      // Admin counts
      db.select({ count: sql<number>`count(*)` }).from(admins),
      db
        .select({ count: sql<number>`count(*)` })
        .from(admins)
        .where(eq(admins.isActive, true)),
      db
        .select({ count: sql<number>`count(*)` })
        .from(admins)
        .where(eq(admins.isActive, false)),

      // Session counts scoped to current admin
      db
        .select({ count: sql<number>`count(*)` })
        .from(adminSessions)
        .where(
          and(
            eq(adminSessions.adminId, authUser.id),
            eq(adminSessions.isActive, true),
            gt(adminSessions.expiresAt, now)
          )
        ),
      db
        .select({ count: sql<number>`count(*)` })
        .from(adminSessions)
        .where(eq(adminSessions.adminId, authUser.id)),
      db
        .select({ count: sql<number>`count(*)` })
        .from(adminSessions)
        .where(
          and(
            eq(adminSessions.adminId, authUser.id),
            or(
              eq(adminSessions.isActive, false),
              lte(adminSessions.expiresAt, now)
            )
          )
        ),

      // Password reset counts
      db
        .select({ count: sql<number>`count(*)` })
        .from(passwordResets)
        .where(
          and(
            eq(passwordResets.isUsed, false),
            gt(passwordResets.expiresAt, now)
          )
        ),
      db
        .select({ count: sql<number>`count(*)` })
        .from(passwordResets)
        .where(eq(passwordResets.isUsed, true)),
      db
        .select({ count: sql<number>`count(*)` })
        .from(passwordResets)
        .where(
          and(
            eq(passwordResets.isUsed, false),
            lte(passwordResets.expiresAt, now)
          )
        ),

      // Recent centers
      db
        .select({
          id: centers.id,
          number: centers.number,
          name: centers.name,
          address: centers.address,
          isActive: centers.isActive,
          createdAt: centers.createdAt,
          modifiedAt: centers.modifiedAt,
        })
        .from(centers)
        .orderBy(desc(centers.createdAt))
        .limit(5),

      // Active sessions with details (scoped to current admin)
      db
        .select({
          session: adminSessions,
          admin: {
            id: admins.id,
            name: admins.name,
            email: admins.email,
            role: admins.role,
          },
        })
        .from(adminSessions)
        .innerJoin(admins, eq(adminSessions.adminId, admins.id))
        .where(
          and(
            eq(adminSessions.adminId, authUser.id),
            eq(adminSessions.isActive, true),
            gt(adminSessions.expiresAt, now)
          )
        )
        .orderBy(desc(adminSessions.lastUsed))
        .limit(10),
    ]);

    // Build response
    const dashboardData = {
      success: true,
      user: {
        id: authUser.id,
        name: authUser.name,
        email: authUser.email,
        role: authUser.role,
        isEmailVerified: authUser.isEmailVerified,
      },
      data: {
        centers: {
          total: totalCentersResult[0]?.count || 0,
          active: activeCentersResult[0]?.count || 0,
          inactive: inactiveCentersResult[0]?.count || 0,
          recentlyCreated: recentlyCreatedCentersResult[0]?.count || 0,
          recentlyModified: recentlyModifiedCentersResult[0]?.count || 0,
        },
        admins: {
          total: totalAdminsResult[0]?.count || 0,
          active: activeAdminsResult[0]?.count || 0,
          inactive: inactiveAdminsResult[0]?.count || 0,
        },
        sessions: {
          active: activeSessionsResult[0]?.count || 0,
          total: totalSessionsResult[0]?.count || 0,
          expired: expiredSessionsResult[0]?.count || 0,
        },
        passwordResets: {
          pending: pendingResetsResult[0]?.count || 0,
          used: usedResetsResult[0]?.count || 0,
          expired: expiredResetsResult[0]?.count || 0,
        },
        recentCenters: recentCentersData.map((center) => ({
          id: center.id,
          number: center.number,
          name: center.name,
          address: center.address,
          isActive: center.isActive,
          createdAt: center.createdAt.toISOString(),
          modifiedAt: center.modifiedAt
            ? center.modifiedAt.toISOString()
            : null,
        })),
        activeSessions: activeSessionsDetailedData.map(
          ({ session, admin }) => ({
            id: session.id,
            admin: {
              name: admin.name,
              email: admin.email,
              role: admin.role,
            },
            lastUsed: session.lastUsed.toISOString(),
            expiresAt: session.expiresAt.toISOString(),
            createdAt: session.createdAt.toISOString(),
          })
        ),
      },
      timestamp: new Date().toISOString(),
    };

    // Private caching
    const response = NextResponse.json(dashboardData);
    response.headers.set(
      "Cache-Control",
      "private, max-age=300, stale-while-revalidate=60"
    );

    return response;
  } catch (error) {
    console.error("Dashboard API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to load dashboard data",
        details:
          process.env.NODE_ENV === "development" && error instanceof Error
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
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization, Cookie",
        "Access-Control-Allow-Credentials": "true",
        "Access-Control-Max-Age": "86400",
      },
    }
  );
}