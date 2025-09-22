// src/app/api/auth/signin/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/server/db/index";
import { comparePassword } from "@/lib/auth";
import { admins, adminActivities, adminSessions } from "@/lib/server/db/schema";
import { eq, and, inArray, desc } from "drizzle-orm";
import { createJWT } from "@/lib/utils/jwt";
import { generateSessionId } from "@/lib/session-manager";
import { getClientIp } from "@/lib/utils/client-ip";
import { logger } from "@/lib/logger";

export async function POST(request: NextRequest) {
  const requestId = logger.requestId();
  const ip = getClientIp(request) || "unknown";

  try {
    logger.info("Login attempt", { requestId, ip });

    const { email, password } = await request.json();

    if (!email || !password) {
      logger.warn("Missing credentials", { requestId, ip });
      return NextResponse.json(
        { success: false, error: "Email and password are required" },
        { status: 400 }
      );
    }

    // Find active admin by email
    const [admin] = await db
      .select()
      .from(admins)
      .where(and(eq(admins.email, email), eq(admins.isActive, true)))
      .limit(1);

    if (!admin) {
      logger.warn("Invalid credentials - admin not found", {
        requestId,
        ip,
        email,
      });
      return NextResponse.json(
        { success: false, error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Verify password
    const isPasswordValid = await comparePassword(password, admin.password);
    if (!isPasswordValid) {
      logger.warn("Invalid credentials - wrong password", {
        requestId,
        ip,
        email,
        userId: admin.id,
      });
      return NextResponse.json(
        { success: false, error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Check if email is verified
    if (!admin.isEmailVerified) {
      logger.warn("Login attempt with unverified email", {
        requestId,
        ip,
        email,
        userId: admin.id,
      });

      // Log failed login attempt due to unverified email
      await db.insert(adminActivities).values({
        id: crypto.randomUUID(),
        adminId: admin.id,
        activity: "USER_LOGIN_BLOCKED_UNVERIFIED_EMAIL",
        timestamp: new Date(),
      });

      return NextResponse.json(
        {
          success: false,
          error: "Please verify your email address before signing in.",
          requiresVerification: true,
          email: admin.email,
        },
        { status: 403 }
      );
    }

    // Generate session ID
    const sessionId = generateSessionId();

    // Create JWT token
    const token = await createJWT({
      userId: admin.id,
      email: admin.email,
      role: admin.role,
      sessionId: sessionId,
    });

    const userAgent = request.headers.get("user-agent") || null;
    const ipAddress = getClientIp(request) || null;
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    const newSessionUUID = crypto.randomUUID();

    // Store session in database
    await db.insert(adminSessions).values({
      id: newSessionUUID,
      adminId: admin.id,
      sessionId,
      token,
      expiresAt,
      isActive: true,
      createdAt: new Date(),
      lastUsed: new Date(),
      userAgent,
      ipAddress,
      location: null,
      deviceType: null,
    });

    // Enforce max 3 active sessions per user (mark extras inactive)
    const activeSessions = await db
      .select()
      .from(adminSessions)
      .where(
        and(
          eq(adminSessions.adminId, admin.id),
          eq(adminSessions.isActive, true)
        )
      )
      .orderBy(desc(adminSessions.createdAt));

    if (activeSessions.length > 3) {
      const sessionsToDeactivate = activeSessions.slice(3);
      const idsToDeactivate = sessionsToDeactivate.map((s) => s.id);

      await db
        .update(adminSessions)
        .set({ isActive: false })
        .where(inArray(adminSessions.id, idsToDeactivate));

      logger.info("Marked old sessions inactive", {
        requestId,
        userId: admin.id,
        removed: idsToDeactivate.length,
      });
    }

    // Update last login time
    await db
      .update(admins)
      .set({ lastLogin: new Date() })
      .where(eq(admins.id, admin.id));

    // Log admin activity
    await db.insert(adminActivities).values({
      id: crypto.randomUUID(),
      adminId: admin.id,
      activity: "USER_LOGIN_SUCCESS",
      timestamp: new Date(),
    });

    logger.info("User logged in successfully", {
      requestId,
      ip,
      userId: admin.id,
      email: admin.email,
      sessionId,
    });

    // Create response with user data
    const response = NextResponse.json({
      success: true,
      message: "Signed in successfully",
      user: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.role,
        isEmailVerified: admin.isEmailVerified,
      },
      sessionId,
    });

    // Set secure HttpOnly cookie
    response.cookies.set("auth-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 24 * 60 * 60, // 24 hours
      path: "/",
    });

    // Set a non-HttpOnly cookie for client-side session awareness
    response.cookies.set("session-active", "true", {
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 24 * 60 * 60,
      path: "/",
    });

    // Set cache control headers
    response.headers.set("Cache-Control", "no-store, max-age=0");

    return response;
  } catch (error) {
    logger.error("Login error", { requestId, ip }, { error });
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
