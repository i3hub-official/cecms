// src/app/api/sessions/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/server/db";
import { adminSessions } from "@/lib/server/db/schema";
import { getUserFromCookies } from "@/lib/auth";
import { eq, and } from "drizzle-orm";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Extract session ID from params
    const { id: sessionId } = await params;

    // Get the current admin user from cookie
    const user = await getUserFromCookies(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check if the session exists and belongs to this user
    const [session] = await db
      .select()
      .from(adminSessions)
      .where(
        and(
          eq(adminSessions.id, sessionId),
          eq(adminSessions.adminId, user.id)
        )
      )
      .limit(1);

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          error: "Session not found",
          details: "The specified session does not exist or you don't have permission to access it",
        },
        { status: 404 }
      );
    }

    // Revoke the session
    await db
      .update(adminSessions)
      .set({ isActive: false })
      .where(eq(adminSessions.id, sessionId));

    return NextResponse.json({
      success: true,
      message: "Session revoked successfully",
    });
  } catch (error) {
    console.error("Session DELETE API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to revoke session",
        details:
          process.env.NODE_ENV === "development" && error instanceof Error
            ? error.message
            : undefined,
      },
      { status: 500 }
    );
  }
}
