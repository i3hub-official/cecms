// src/app/api/sessions/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/server/db";
import { adminSessions } from "@/lib/server/db/schema";
import { validateSession } from "@/lib/auth";
import { eq, and } from "drizzle-orm";

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Validate admin session
    const authResult = await validateSession(request);
    if (!authResult.isValid) {
      return NextResponse.json(
        { success: false, error: "Unauthorized", details: authResult.error },
        { status: 401 }
      );
    }

    if (!authResult.user) {
      return NextResponse.json(
        { success: false, error: "Invalid user session" },
        { status: 400 }
      );
    }

    const sessionId = params.id;

    // Verify the session belongs to the current admin
    const session = await db
      .select()
      .from(adminSessions)
      .where(
        and(
          eq(adminSessions.id, sessionId),
          eq(adminSessions.adminId, authResult.user.id)
        )
      )
      .limit(1);

    if (session.length === 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Session not found",
          details: "The specified session does not exist or you don't have permission to access it"
        },
        { status: 404 }
      );
    }

    // Revoke the specific session
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
        details: process.env.NODE_ENV === "development" && error instanceof Error
          ? error.message
          : undefined,
      },
      { status: 500 }
    );
  }
}