// src/app/api/auth/validate/route.ts
import { NextRequest, NextResponse } from "next/server";
import { validateSession } from "@/lib/auth";
import { cookies } from "next/headers";
import { logger } from "@/lib/logger";


export async function GET(request: NextRequest) {
  const requestId = logger.requestId();
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";

  try {
     logger.info("Incoming /api/auth/validate request", { requestId, ip });
    // First try to get token from Authorization header
    let token = request.headers.get("authorization")?.replace("Bearer ", "");
    logger.info("[AUTH] Token from Authorization header:", { token: token ? "[REDACTED]" : "None" });

    // If not in header, try cookie
    if (!token) {
      token = request.cookies.get("auth-token")?.value || undefined;
      logger.info("[AUTH] Token from cookie:", { token: token ? "[REDACTED]" : "None" });
    }

    // If still no token, check if we have a cached session
    if (!token) {
      console.log("[AUTH] No token found, checking cached session...");
      const cookieStore = await cookies();
      const cachedSession = cookieStore.get("cached-auth");

      if (cachedSession?.value) {
        try {
          const sessionData = JSON.parse(cachedSession.value);
          const now = Date.now();
          console.log("[AUTH] Found cached session:", {
            hasUser: !!sessionData.user,
            ageMs: now - sessionData.timestamp,
          });

          // Use cached session if it's less than 10 minutes old
          if (now - sessionData.timestamp < 10 * 60 * 1000) {
            console.log("[AUTH] Returning cached session");
            return NextResponse.json({
              success: true,
              user: sessionData.user,
              cached: true,
            });
          } else {
            console.log("[AUTH] Cached session expired");
          }
        } catch (err) {
          console.warn("[AUTH] Failed to parse cached session:", err);
        }
      } else {
        console.log("[AUTH] No cached session found");
      }

      return NextResponse.json(
        { success: false, error: "No authentication token provided" },
        { status: 401 }
      );
    }

    console.log("[AUTH] Validating session with token...");
    const validationResult = await validateSession(request);
    console.log("[AUTH] Validation result:", {
      isValid: validationResult.isValid,
      hasUser: !!validationResult.user,
      error: validationResult.error,
    });

    if (!validationResult.isValid || !validationResult.user) {
      console.warn("[AUTH] Invalid session");
      return NextResponse.json(
        {
          success: false,
          error: validationResult.error || "Invalid session",
        },
        { status: 401 }
      );
    }

    console.log("[AUTH] Session is valid, caching result...");
    const response = NextResponse.json({
      success: true,
      user: validationResult.user,
    });

    // Cache the session for potential network outages
    response.cookies.set(
      "cached-auth",
      JSON.stringify({
        user: validationResult.user,
        timestamp: Date.now(),
      }),
      {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 10 * 60, // 10 minutes
      }
    );

    response.headers.set("Cache-Control", "no-store, max-age=0");
     logger.info("Returning valid session", { requestId, ip, userId: validationResult.user.id });
    return response;
  } catch (error) {
    logger.error("Session validation error", { requestId, ip }, { error });
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
