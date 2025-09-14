import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken, getAuthToken } from "@/lib/auth";
import {
  getUserActiveSessions,
  revokeAllUserSessions,
} from "@/lib/session-manager";

// Get user's active sessions
export async function GET(request: NextRequest) {
  try {
    const token = getAuthToken(request);
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const sessions = await getUserActiveSessions(payload.userId);

    return NextResponse.json({
      success: true,
      data: sessions.map((session) => ({
        id: session.id,
        sessionId: session.sessionId,
        createdAt: session.createdAt,
        lastUsed: session.lastUsed,
        expiresAt: session.expiresAt,
      })),
    });
  } catch (error) {
    console.error("Get sessions error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Revoke all sessions (force logout from all devices)
export async function DELETE(request: NextRequest) {
  try {
    const token = getAuthToken(request);
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    await revokeAllUserSessions(payload.userId);

    return NextResponse.json({
      success: true,
      message: "All sessions revoked successfully",
    });
  } catch (error) {
    console.error("Revoke sessions error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
