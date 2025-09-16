// src/app/api/auth/signin/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/server/db/index";
import { comparePassword, createAuthSession } from "@/lib/auth"; // Use createAuthSession instead
import { admins } from "@/lib/server/db/schema";
import { eq, and } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
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
      return NextResponse.json(
        { success: false, error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Verify password
    const isPasswordValid = await comparePassword(password, admin.password);
    if (!isPasswordValid) {
      return NextResponse.json(
        { success: false, error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Get user agent and IP for session tracking
    const userAgent = request.headers.get("user-agent") || undefined;
    const ipAddress =
      request.headers.get("x-forwarded-for") ||
      request.headers.get("x-real-ip") ||
      "unknown";

    // Use createAuthSession to properly create both token and session
    const { token, sessionId } = await createAuthSession(
      admin.id,
      admin.email,
      admin.role,
      admin.name,
      userAgent,
      ipAddress
    );

    // Return user info
    const response = NextResponse.json({
      success: true,
      message: "Signed in successfully",
      user: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.role,
      },
      sessionId, // Optional: return session ID for client-side tracking
    });

    // ✅ Set secure HttpOnly cookie
    response.cookies.set("auth-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 24 * 60 * 60, // 24 hours
      path: "/",
    });

    // Also set a non-HttpOnly cookie for client-side session awareness
    response.cookies.set("session-active", "true", {
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 24 * 60 * 60,
      path: "/",
    });

    // Set cache control headers
    response.headers.set("Cache-Control", "no-store, max-age=0");
    response.headers.set("Authorization", `Bearer ${token}`);

    return response;
  } catch (error) {
    console.error("Signin error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
