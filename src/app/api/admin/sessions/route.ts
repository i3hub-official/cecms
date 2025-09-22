// src/app/api/admin/sessions/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/server/db";
import { adminSessions } from "@/lib/server/db/schema";
import { getUserFromCookies } from "@/lib/auth";
import { eq, and, desc } from "drizzle-orm";

// GET - Get current admin's sessions (for security tab)
export async function GET(request: NextRequest) {
  try {
    const authUser = await getUserFromCookies(request);
    if (!authUser) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get all active sessions for the current admin
    const sessions = await db
      .select({
        id: adminSessions.id,
        sessionId: adminSessions.sessionId,
        createdAt: adminSessions.createdAt,
        lastUsed: adminSessions.lastUsed,
        expiresAt: adminSessions.expiresAt,
        userAgent: adminSessions.userAgent,
        ipAddress: adminSessions.ipAddress,
        location: adminSessions.location,
        deviceType: adminSessions.deviceType,
      })
      .from(adminSessions)
      .where(
        and(
          eq(adminSessions.adminId, authUser.id),
          eq(adminSessions.isActive, true)
        )
      )
      .orderBy(desc(adminSessions.lastUsed));

    // Add device info for display
    const sessionsWithDeviceInfo = sessions.map((session) => ({
      ...session,
      deviceInfo: session.userAgent
        ? parseUserAgent(session.userAgent)
        : "Unknown device",
    }));

    return NextResponse.json({
      success: true,
      data: sessionsWithDeviceInfo,
    });
  } catch (error) {
    console.error("Admin sessions GET error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch sessions",
        details:
          process.env.NODE_ENV === "development" && error instanceof Error
            ? error.message
            : undefined,
      },
      { status: 500 }
    );
  }
}

// Helper function to parse user agent for device info
function parseUserAgent(userAgent: string): string {
  if (
    userAgent.includes("Mobile") ||
    userAgent.includes("Android") ||
    userAgent.includes("iPhone")
  ) {
    if (userAgent.includes("Chrome")) return "Mobile Chrome";
    if (userAgent.includes("Safari")) return "Mobile Safari";
    if (userAgent.includes("Firefox")) return "Mobile Firefox";
    return "Mobile Browser";
  }

  if (userAgent.includes("Chrome")) return "Desktop Chrome";
  if (userAgent.includes("Safari")) return "Desktop Safari";
  if (userAgent.includes("Firefox")) return "Desktop Firefox";
  if (userAgent.includes("Edge")) return "Desktop Edge";

  return "Desktop Browser";
}
