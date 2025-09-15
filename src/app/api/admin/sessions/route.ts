// src/app/api/admin/sessions/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  verifyToken,
  getAuthToken,
  comparePassword,
  generateSessionId,
  generateToken,
} from "@/lib/auth";
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
      data: sessions.map((session) => {
        const s = session as {
          id: string;
          sessionId: string;
          createdAt: Date;
          lastUsed: Date;
          expiresAt: Date;
          userAgent?: string | null;
          ipAddress?: string | null;
          location?: string | null;
          deviceType?: string | null;
        };
        return {
          id: session.id,
          sessionId: session.sessionId,
          createdAt: session.createdAt,
          lastUsed: session.lastUsed,
          expiresAt: session.expiresAt,
          // Add user agent and IP information if available (handle null values)
          userAgent: s.userAgent || "Unknown",
          ipAddress: s.ipAddress || "Unknown",
          location: s.location || "Unknown",
          deviceType: s.deviceType || "Unknown",
        };
      }),
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

    // Log this activity for auditing
    await prisma.adminActivity.create({
      data: {
        adminId: payload.userId,
        activity: "REVOKED_ALL_SESSIONS",
        timestamp: new Date(),
      },
    });

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

// Create a new session (login)
export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    // Find admin user
    const admin = await prisma.admin.findUnique({
      where: { email, isActive: true },
    });

    if (!admin) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Verify password
    const isPasswordValid = await comparePassword(password, admin.password);
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Generate session token
    const sessionId = generateSessionId();
    const token = generateToken({
      userId: admin.id,
      email: admin.email,
      role: admin.role,
    });

    // Get client information for auditing
    const userAgent = request.headers.get("user-agent") || "Unknown";
    const ipAddress =
      request.headers.get("x-forwarded-for") ||
      request.headers.get("x-real-ip") ||
      "Unknown";

    // Simple device type detection
    let deviceType = "Unknown";
    if (userAgent.includes("Mobile")) {
      deviceType = "Mobile";
    } else if (userAgent.includes("Tablet")) {
      deviceType = "Tablet";
    } else if (
      userAgent.includes("Windows") ||
      userAgent.includes("Macintosh") ||
      userAgent.includes("Linux")
    ) {
      deviceType = "Desktop";
    }

    // Create session in database
    await prisma.adminSession.create({
      data: {
        adminId: admin.id,
        sessionId,
        token,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        // You could add geolocation here using a service like IPAPI
      },
    });

    // Log login activity
    await prisma.adminActivity.create({
      data: {
        adminId: admin.id,
        activity: "LOGIN",
        timestamp: new Date(),
      },
    });

    // Create response with token in both cookie and response body
    const response = NextResponse.json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.role,
      },
    });

    // Set HTTP-only cookie for browser clients
    response.cookies.set("auth-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 24 * 60 * 60, // 24 hours
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Revoke specific session
export async function PATCH(request: NextRequest) {
  try {
    const token = getAuthToken(request);
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const { sessionId } = await request.json();
    if (!sessionId) {
      return NextResponse.json(
        { error: "Session ID is required" },
        { status: 400 }
      );
    }

    // Revoke the specific session
    await prisma.adminSession.updateMany({
      where: {
        sessionId,
        adminId: payload.userId,
      },
      data: {
        isActive: false,
        expiresAt: new Date(), // Immediate expiration
      },
    });

    // Log this activity for auditing
    await prisma.adminActivity.create({
      data: {
        adminId: payload.userId,
        activity: "REVOKED_SESSION",
        timestamp: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Session revoked successfully",
    });
  } catch (error) {
    console.error("Revoke session error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
