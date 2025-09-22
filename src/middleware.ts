// src/middleware.ts - FIXED VERSION (Edge compatible)
import { NextRequest, NextResponse } from "next/server";
import {
  chainMiddlewares,
  withPathsEdge,
} from "@/lib/middleware/middlewareChain-edge";
import { withSecurityHeaders } from "@/lib/middleware/securityHeaders";
import { withRequestLogging } from "@/lib/middleware/requestLogging";
import { withRateLimiter } from "@/lib/middleware/rateLimiting";
import { withCors } from "@/lib/middleware/withCors";

// ========= Public Path Configuration =========
const publicPaths = [
  "/",
  "/auth/signin",
  "/auth/signup",
  "/auth/forgot-password",
  "/auth/reset-password",
  "/api/auth/verify-email",
  "/api/auth/resend-verification",
  "/api/auth/validate-reset-token",
  "/api/auth/*",
  "/api/health",
  "/api/centers-lookup",  
];

// ========= Matcher Config =========
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)",
  ],
};

// ========= Main Middleware =========
export async function middleware(request: NextRequest): Promise<Response> {
  try {
    // Special handling for centers-lookup API (public CORS)
    if (request.nextUrl.pathname.startsWith("/api/centers-lookup")) {
      const response = NextResponse.next();
      response.headers.set("Access-Control-Allow-Origin", "*");
      response.headers.set("Access-Control-Allow-Methods", "GET, OPTIONS");
      response.headers.set("Access-Control-Allow-Headers", "Content-Type");
      return response;
    }

    return await chainMiddlewares(request, [
      withCors,
      withSecurityHeaders,
      async (req) => {
        await withRequestLogging(req);
        return NextResponse.next();
      },
      async (req) => await withRateLimiter(req),
      withPathsEdge(publicPaths), // ✅ Edge-compatible auth
    ]);
  } catch (error) {
    console.error("Middleware chain error:", error);
    return new Response("Internal Server Error", {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
