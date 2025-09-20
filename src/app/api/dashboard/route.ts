// src/app/api/dashboard/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/server/db/index";
import {
  centers,
  admins,
  adminSessions,
  passwordResets,
} from "@/lib/server/db/schema";
import { validateSession } from "@/lib/auth";
import { eq, and, or, gte, lte, gt, desc } from "drizzle-orm";
import { sql } from "drizzle-orm";

// GET /api/dashboard - Get dashboard statistics
export async function GET(request: NextRequest) {
  try {
    // Validate admin session
    const authResult = await validateSession(request);
    if (!authResult.isValid) {
      return NextResponse.json(
        { success: false, error: "Unauthorized", details: authResult.error },
        { status: 401 }
      );
    }

    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Get all statistics in parallel for better performance
    const [
      // Center counts
      totalCentersResult,
      activeCentersResult,
      inactiveCentersResult,
      recentlyCreatedCentersResult,
      recentlyModifiedCentersResult,

      // Admin counts
      totalAdminsResult,
      activeAdminsResult,
      inactiveAdminsResult,

      // Session counts
      activeSessionsResult,
      totalSessionsResult,
      expiredSessionsResult,

      // Password reset counts
      pendingResetsResult,
      usedResetsResult,
      expiredResetsResult,

      // Recent centers
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

      // Session counts
      db
        .select({ count: sql<number>`count(*)` })
        .from(adminSessions)
        .where(
          and(
            eq(adminSessions.isActive, true),
            eq(adminSessions.id, admins.id),
            gt(adminSessions.expiresAt, now)
          )
        ),
      db.select({ count: sql<number>`count(*)` }).from(adminSessions),
      db
        .select({ count: sql<number>`count(*)` })
        .from(adminSessions)
        .where(
          or(
            eq(adminSessions.isActive, false),
            lte(adminSessions.expiresAt, now)
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

      // Recent centers with full details
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

      // Active sessions with admin details (using join)
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
            eq(adminSessions.isActive, true),
            gt(adminSessions.expiresAt, now)
          )
        )
        .orderBy(desc(adminSessions.lastUsed))
        .limit(10),
    ]);

    // Extract counts from results
    const totalCenters = totalCentersResult[0]?.count || 0;
    const activeCenters = activeCentersResult[0]?.count || 0;
    const inactiveCenters = inactiveCentersResult[0]?.count || 0;
    const recentlyCreatedCenters = recentlyCreatedCentersResult[0]?.count || 0;
    const recentlyModifiedCenters =
      recentlyModifiedCentersResult[0]?.count || 0;

    const totalAdmins = totalAdminsResult[0]?.count || 0;
    const activeAdmins = activeAdminsResult[0]?.count || 0;
    const inactiveAdmins = inactiveAdminsResult[0]?.count || 0;

    const activeSessions = activeSessionsResult[0]?.count || 0;
    const totalSessions = totalSessionsResult[0]?.count || 0;
    const expiredSessions = expiredSessionsResult[0]?.count || 0;

    const pendingResets = pendingResetsResult[0]?.count || 0;
    const usedResets = usedResetsResult[0]?.count || 0;
    const expiredResets = expiredResetsResult[0]?.count || 0;

    // Build response data
    const dashboardData = {
      success: true,
      data: {
        centers: {
          total: totalCenters,
          active: activeCenters,
          inactive: inactiveCenters,
          recentlyCreated: recentlyCreatedCenters,
          recentlyModified: recentlyModifiedCenters,
        },
        admins: {
          total: totalAdmins,
          active: activeAdmins,
          inactive: inactiveAdmins,
        },
        sessions: {
          active: activeSessions,
          total: totalSessions,
          expired: expiredSessions,
        },
        passwordResets: {
          pending: pendingResets,
          used: usedResets,
          expired: expiredResets,
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
    };

    // Set cache headers for reasonable caching (5 minutes)
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
