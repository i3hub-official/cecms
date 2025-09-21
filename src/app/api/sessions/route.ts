// src/app/api/sessions/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/server/db";
import { adminSessions } from "@/lib/server/db/schema";
import { validateSession } from "@/lib/auth";
import { eq, and, gt } from "drizzle-orm";
import { sql } from "drizzle-orm";

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

    // Get all active sessions for the current admin
    const sessions = await db
      .select({
        id: adminSessions.id,
        sessionId: adminSessions.sessionId,
        createdAt: adminSessions.createdAt,
        lastUsed: adminSessions.lastUsed,
        expiresAt: adminSessions.expiresAt,
        deviceInfo: adminSessions.deviceType,
        location: adminSessions.location,
      })
      .from(adminSessions)
      .where(
        and(
          authResult.user ? eq(adminSessions.adminId, authResult.user.id) : undefined,
          eq(adminSessions.isActive, true),
          gt(adminSessions.expiresAt, new Date())
        )
      )
      .orderBy(adminSessions.lastUsed);

    return NextResponse.json({
      success: true,
      data: sessions.map(session => ({
        ...session,
        createdAt: session.createdAt.toISOString(),
        lastUsed: session.lastUsed.toISOString(),
        expiresAt: session.expiresAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error("Sessions GET API error:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to fetch sessions",
        details: process.env.NODE_ENV === "development" && error instanceof Error
          ? error.message
          : undefined,
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Validate admin session
    const authResult = await validateSession(request);
    if (!authResult.isValid) {
      return NextResponse.json(
        { success: false, error: "Unauthorized", details: authResult.error },
        { status: 401 }
      );
    }

    if (!authResult.user || !authResult.sessionId) {
      return NextResponse.json(
        { success: false, error: "Invalid session data" },
        { status: 400 }
      );
    }

    // Revoke all sessions except the current one
    await db
      .update(adminSessions)
      .set({ isActive: false })
      .where(
        and(
          eq(adminSessions.adminId, authResult.user.id),
          eq(adminSessions.isActive, true),
          eq(adminSessions.sessionId, authResult.sessionId)
        )
      );

    return NextResponse.json({
      success: true,
      message: "All other sessions revoked successfully",
    });
  } catch (error) {
    console.error("Sessions DELETE API error:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to revoke sessions",
        details: process.env.NODE_ENV === "development" && error instanceof Error
          ? error.message
          : undefined,
      },
      { status: 500 }
    );
  }
}