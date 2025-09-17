import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/server/db";
import { adminSessions } from "@/lib/server/db/schema";
import { eq } from "drizzle-orm";
import { validateSession } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const validation = await validateSession(request);

    if (!validation.isValid || !validation.user) {
      return NextResponse.json(
        { success: false, error: validation.error || "Unauthorized" },
        { status: 401 }
      );
    }

    const sessions = await db
      .select()
      .from(adminSessions)
      .where(eq(adminSessions.adminId, validation.user.id));

    return NextResponse.json({
      success: true,
      data: sessions.map((s) => ({
        id: s.id,
        sessionId: s.sessionId,
        createdAt: s.createdAt,
        lastUsed: s.lastUsed,
        expiresAt: s.expiresAt,
        deviceInfo: s.userAgent || null,
        location: s.location || null,
      })),
    });
  } catch (error) {
    console.error("GET /api/sessions error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const validation = await validateSession(request);

    if (!validation.isValid || !validation.user) {
      return NextResponse.json(
        { success: false, error: validation.error || "Unauthorized" },
        { status: 401 }
      );
    }

    // Revoke all sessions for this user
    await db
      .update(adminSessions)
      .set({ isActive: false, expiresAt: new Date() })
      .where(eq(adminSessions.adminId, validation.user.id));

    const response = NextResponse.json({
      success: true,
      message: "All sessions revoked",
    });

    // Clear auth cookies
    response.cookies.set("auth-token", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 0,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("DELETE /api/sessions error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
