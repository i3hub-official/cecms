// src/app/api/auth/signout/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/server/db/index";
import { adminSessions, adminActivities } from "@/lib/server/db/schema";
import { eq, and } from "drizzle-orm";
import { getClientIp } from "@/lib/utils/client-ip";
import { logger } from "@/lib/logger";


export async function POST(request: NextRequest) {
  let ip: string;
  try {
    const clientIp = await getClientIp(request);
    ip = clientIp || "unknown";
    logger.info("Signout attempt", { ip });

    const authHeader = request.headers.get("authorization");
    let token = authHeader?.startsWith("Bearer ")
      ? authHeader.substring(7)
      : null;

    if (!token) {
      token = request.cookies.get("auth-token")?.value || null;
    }

    if (!token) {
      logger.warn("No token provided for signout", { ip });
      return NextResponse.json(
        { success: false, error: "No token provided" },
        { status: 401 }
      );
    }

    // Verify JWT to get user info for logging
    const { verifyJWT } = await import("@/lib/utils/jwt");
    const jwtResult = await verifyJWT(token);

    let adminId: string | null = null;

    if (jwtResult.isValid && jwtResult.payload) {
      adminId = jwtResult.payload.userId;
    }

    // Update session to mark as inactive - FIXED the where clause
    await db
      .update(adminSessions)
      .set({
        isActive: false,
        expiresAt: new Date(),
      })
      .where(
        and(eq(adminSessions.token, token), eq(adminSessions.isActive, true))
      );

    // Log admin activity if we have adminId
    if (adminId) {
      await db.insert(adminActivities).values({
        id: crypto.randomUUID(),
        adminId,
        activity: "USER_LOGOUT",
        timestamp: new Date(),
      });
    }

    logger.info("User signed out successfully", {
      ip,
      adminId: adminId || "unknown",
    });

    const response = NextResponse.json({
      success: true,
      message: "Logged out successfully",
    });

    // Clear auth cookies
    response.cookies.set("auth-token", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 0,
      path: "/",
    });

    response.cookies.set("session-active", "", {
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 0,
      path: "/",
    });

    response.headers.set("Cache-Control", "no-store, max-age=0");

    return response;
  } catch (error) {}
}
