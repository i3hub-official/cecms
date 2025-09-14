// src/app/api/admin/cleanup/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma"; // use singleton client
import { validateSession } from "@/lib/auth";

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
      data: {
        isActive: false,
      },
    });

    // Clean up expired password reset tokens (if table exists)
    let expiredResetsResult = { count: 0 };
    try {
      expiredResetsResult = await prisma.passwordReset.deleteMany({
        where: {
          OR: [
            { expiresAt: { lte: now } },
            {
              isUsed: true,
              createdAt: { lte: oneDayAgo },
            },
          ],
        },
      });
    } catch (error) {
      // PasswordReset table might not exist yet
      console.log("PasswordReset table not found, skipping cleanup");
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

// GET endpoint to check what would be cleaned up (dry run)
export async function GET(request: NextRequest) {
  try {
    const authResult = await validateSession(request);
    if (!authResult.isValid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Count what would be cleaned up
    const [expiredSessionsCount, expiredResetsCount] = await Promise.all([
      prisma.adminSession.count({
        where: {
          OR: [
            { expiresAt: { lte: now } },
            {
              lastUsed: { lte: sevenDaysAgo },
              isActive: true,
            },
          ],
        },
      }),
      prisma.passwordReset
        ?.count({
          where: {
            OR: [
              { expiresAt: { lte: now } },
              {
                isUsed: true,
                createdAt: { lte: oneDayAgo },
              },
            ],
          },
        })
        .catch(() => 0) || Promise.resolve(0),
    ]);

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
