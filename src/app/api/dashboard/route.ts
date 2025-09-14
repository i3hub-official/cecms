// src/app/api/dashboard/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateSession } from "@/lib/auth";

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
      // Center statistics
      totalCenters,
      activeCenters,
      inactiveCenters,
      recentlyCreatedCenters,
      recentlyModifiedCenters,

      // Admin statistics
      totalAdmins,
      activeAdmins,
      inactiveAdmins,

      // Session statistics
      activeSessions,
      totalSessions,
      expiredSessions,

      // Password reset statistics (handle if table doesn't exist yet)
      pendingResets,
      usedResets,
      expiredResets,

      // Recent data for tables
      recentCenters,
      activeSessionsDetailed,
    ] = await Promise.all([
      // Center counts
      prisma.center.count(),
      prisma.center.count({ where: { isActive: true } }),
      prisma.center.count({ where: { isActive: false } }),
      prisma.center.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
      prisma.center.count({ where: { modifiedAt: { gte: sevenDaysAgo } } }),

      // Admin counts
      prisma.admin.count(),
      prisma.admin.count({ where: { isActive: true } }),
      prisma.admin.count({ where: { isActive: false } }),

      // Session counts
      prisma.adminSession.count({
        where: {
          isActive: true,
          expiresAt: { gt: now },
        },
      }),
      prisma.adminSession.count(),
      prisma.adminSession.count({
        where: {
          OR: [{ isActive: false }, { expiresAt: { lte: now } }],
        },
      }),

      // Password reset counts (with proper error handling)
      prisma.passwordReset
        ?.count({
          where: {
            isUsed: false,
            expiresAt: { gt: now },
          },
        })
        .catch(() => 0) || 0,
      prisma.passwordReset
        ?.count({ where: { isUsed: true } })
        .catch(() => 0) || 0,
      prisma.passwordReset
        ?.count({
          where: {
            isUsed: false,
            expiresAt: { lte: now },
          },
        })
        .catch(() => 0) || 0,

      // Recent centers with full details
      prisma.center.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          number: true,
          name: true,
          address: true,
          isActive: true,
          createdAt: true,
          modifiedAt: true,
        },
      }),

      // Active sessions with admin details
      prisma.adminSession.findMany({
        where: {
          isActive: true,
          expiresAt: { gt: now },
        },
        take: 10,
        orderBy: { lastUsed: "desc" },
        include: {
          admin: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
        },
      }),
    ]);

    // Build response data compatible with your existing dashboard
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
        recentCenters: recentCenters.map((center) => ({
          id: center.id,
          number: center.number,
          name: center.name,
          address: center.address,
          isActive: center.isActive,
          createdAt: center.createdAt.toISOString(),
          modifiedAt: center.modifiedAt.toISOString(),
        })),
        activeSessions: activeSessionsDetailed.map((session) => ({
          id: session.id,
          admin: {
            name: session.admin.name,
            email: session.admin.email,
            role: session.admin.role,
          },
          lastUsed: session.lastUsed.toISOString(),
          expiresAt: session.expiresAt.toISOString(),
          createdAt: session.createdAt.toISOString(),
        })),
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
  } finally {
    await prisma.$disconnect();
  }
}