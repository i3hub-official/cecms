// File: src/middleware.ts
import { NextRequest, NextResponse } from "next/server";
import { chainMiddlewares } from "@/lib/middleware/middlewareChain";
import { withSecurityHeaders } from "@/lib/middleware/securityHeaders";
import { withRequestLogging } from "@/lib/middleware/requestLogging";
import { withRateLimiter } from "@/lib/middleware/rateLimiting";
import { withCors } from "@/lib/middleware/withCors";

// ========= Matcher Config =========
export const config = {
  matcher: [
    "/api/:path*", 
    "/((?!api/auth|_next/static|_next/image|favicon.ico|robots.txt|health).*)",
  ],
};

// ========= Middleware =========
export async function middleware(request: NextRequest): Promise<Response> {
  try {
    // Special handling for centers-lookup API (CORS only)
    if (request.nextUrl.pathname.startsWith("/api/centers-lookup")) {
      const response = NextResponse.next();
      response.headers.set("Access-Control-Allow-Origin", "*");
      response.headers.set("Access-Control-Allow-Methods", "GET");
      response.headers.set("Access-Control-Allow-Headers", "Content-Type");
      return response;
    }

    // Otherwise, run the full middleware chain
    return await chainMiddlewares(request, [
      withCors,
      withSecurityHeaders,
      async (req) => {
        await withRequestLogging(req);
        return NextResponse.next();
      },
      withRateLimiter,
    ]);
  } catch (error) {
    console.error("Middleware chain error:", error);
    return new Response("Internal Server Error", {
      status: 500,
      headers: { "Access-Control-Allow-Origin": "*" },
    });
  }
}
