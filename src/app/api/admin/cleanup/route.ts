// src/app/api/admin/cleanup/route.ts
import { NextRequest, NextResponse } from "next/server";
import { validateSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    // Validate admin session
    const authResult = await validateSession(request);
    if (!authResult.isValid || authResult.user?.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized - Admin access required" },
        { status: 401 }
      );
    }

    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Clean up expired sessions
    const expiredSessionsResult = await prisma.adminSession.updateMany({
      where: {
        OR: [
          { expiresAt: { lte: now } },
          {
            lastUsed: { lte: sevenDaysAgo },
            isActive: true,
          },
        ],
      },
      data: { isActive: false },
    });

    // Clean up expired password reset tokens
    let expiredResetsResult = { count: 0 };
    if (prisma.passwordReset) {
      try {
        expiredResetsResult = await prisma.passwordReset.deleteMany({
          where: {
            OR: [
              { expiresAt: { lte: now } },
              { isUsed: true, createdAt: { lte: oneDayAgo } },
            ],
          },
        });
      } catch {
        console.log("PasswordReset table not found, skipping cleanup");
      }
    }

    return NextResponse.json({
      success: true,
      message: "System cleanup completed successfully",
      results: {
        expiredSessions: expiredSessionsResult.count,
        expiredResets: expiredResetsResult.count,
        cleanupTime: now.toISOString(),
      },
    });
  } catch (error) {
    console.error("Cleanup API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Cleanup operation failed",
        details:
          process.env.NODE_ENV === "development" && error instanceof Error
            ? error.message
            : undefined,
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Import prisma inside function
    const { prisma } = await import("@/lib/prisma");

    const authResult = await validateSession(request);
    if (!authResult.isValid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Count expired sessions
    const expiredSessionsCount = await prisma.adminSession.count({
      where: {
        OR: [
          { expiresAt: { lte: now } },
          { lastUsed: { lte: sevenDaysAgo }, isActive: true },
        ],
      },
    });

    // Count expired password resets
    let expiredResetsCount = 0;
    if (prisma.passwordReset) {
      try {
        expiredResetsCount = await prisma.passwordReset.count({
          where: {
            OR: [
              { expiresAt: { lte: now } },
              { isUsed: true, createdAt: { lte: oneDayAgo } },
            ],
          },
        });
      } catch {
        expiredResetsCount = 0;
      }
    }

    return NextResponse.json({
      success: true,
      preview: {
        expiredSessions: expiredSessionsCount,
        expiredResets: expiredResetsCount,
        wouldCleanup: expiredSessionsCount + expiredResetsCount > 0,
      },
    });
  } catch (error) {
    console.error("Cleanup preview error:", error);
    return NextResponse.json(
      { error: "Failed to preview cleanup" },
      { status: 500 }
    );
  }
}
