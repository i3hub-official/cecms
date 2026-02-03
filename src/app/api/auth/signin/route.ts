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

    // DEBUG: Log JWT info
    console.log("=== JWT DEBUG INFO ===");
    console.log("Admin name from DB:", admin.name);
    console.log("JWT payload being sent:", {
      userId: admin.id,
      email: admin.email,
      role: admin.role,
      sessionId: sessionId,
      name: admin.name,
    });

    // Create JWT token
    const token = await createJWT({
      userId: admin.id,
      email: admin.email,
      role: admin.role,
      sessionId: sessionId,
      name: admin.name,
    });

    console.log("JWT token created, length:", token.length);
    console.log("Token first 100 chars:", token.substring(0, 100));

    const userAgent = request.headers.get("user-agent") || null;
    const ipAddress = getClientIp(request) || null;
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    const newSessionUUID = crypto.randomUUID();

    // DEBUG: Session creation
    console.log("=== SESSION CREATION DEBUG ===");
    console.log("Token to insert length:", token.length);
    console.log("Session UUID:", newSessionUUID);

    try {
      // Store session in database with detailed error handling
      const [insertedSession] = await db
        .insert(adminSessions)
        .values({
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
        })
        .returning();

      console.log("Session inserted successfully:", !!insertedSession);
      console.log("Inserted session ID:", insertedSession?.id);

      // Immediately verify it was saved
      const verifySession = await db
        .select()
        .from(adminSessions)
        .where(eq(adminSessions.id, newSessionUUID))
        .limit(1);

      console.log("Verification - session found:", verifySession.length > 0);
      if (verifySession[0]) {
        console.log("Verified token length:", verifySession[0].token?.length);
        console.log("Tokens match:", verifySession[0].token === token);
      }

    } catch (insertError: any) {
      console.error("FAILED TO INSERT SESSION:", {
        message: insertError.message,
        code: insertError.code,
        detail: insertError.detail,
        constraint: insertError.constraint,
        table: insertError.table,
      });

      // Check for specific errors
      if (insertError.message?.includes("unique constraint")) {
        console.error("UNIQUE CONSTRAINT VIOLATION - token already exists?");
        // Try with a new token
        const newToken = await createJWT({
          userId: admin.id,
          email: admin.email,
          role: admin.role,
          sessionId: sessionId,
          name: admin.name,
        });
        
        console.log("Retrying with new token...");
        const [retrySession] = await db
          .insert(adminSessions)
          .values({
            id: crypto.randomUUID(),
            adminId: admin.id,
            sessionId,
            token: newToken,
            expiresAt,
            isActive: true,
            createdAt: new Date(),
            lastUsed: new Date(),
            userAgent,
            ipAddress,
            location: null,
            deviceType: null,
          })
          .returning();
          
        console.log("Retry successful:", !!retrySession);
      } else if (insertError.message?.includes("value too long")) {
        console.error("VALUE TOO LONG - token might be truncated");
        throw new Error("Token too long for database column");
      } else {
        throw insertError;
      }
    }

    // DEBUG: Count all sessions
    const allSessions = await db.select().from(adminSessions);
    console.log("Total sessions in DB:", allSessions.length);

    // Find the session we just created
    const foundSession = await db.select().from(adminSessions).where(eq(adminSessions.token, token));
    console.log("Session found by token:", foundSession.length > 0);
    if (foundSession[0]) {
      console.log("Stored token length:", foundSession[0].token?.length);
      console.log("Tokens match:", foundSession[0].token === token);
    }

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

    // DEBUG: Cookie settings
    console.log("=== COOKIE DEBUG ===");
    console.log("Setting cookie with token length:", token.length);
    console.log("NODE_ENV:", process.env.NODE_ENV);
    const isProduction = process.env.NODE_ENV === "production";

    // Set secure HttpOnly cookie
    response.cookies.set({
      name: "auth-token",
      value: token,
      httpOnly: true,
      secure: isProduction, // false for local development, true for production
      sameSite: "lax",
      maxAge: 24 * 60 * 60, // 24 hours in seconds
      path: "/",
    });

    // Set a non-HttpOnly cookie for client-side session awareness
    response.cookies.set({
      name: "session-active",
      value: "true",
      httpOnly: false,
      secure: isProduction,
      sameSite: "lax",
      maxAge: 24 * 60 * 60,
      path: "/",
    });

    // DEBUG: Check what cookies are being set
    console.log("Response cookies being set:");
    response.cookies.getAll().forEach(cookie => {
      console.log(`- ${cookie.name}: ${cookie.value ? "SET" : "NOT SET"}`);
    });

    // Add CORS headers for development
    if (!isProduction) {
      const origin = request.headers.get("origin");
      if (origin && (origin.includes("localhost") || origin.includes("127.0.0.1"))) {
        response.headers.set("Access-Control-Allow-Credentials", "true");
        response.headers.set("Access-Control-Allow-Origin", origin);
      }
    }

    // Set cache control headers
    response.headers.set("Cache-Control", "no-store, max-age=0");

    return response;
  } catch (error) {
    logger.error("Login error", { requestId, ip }, { error });
    console.error("SIGNIN ERROR DETAILS:", error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}