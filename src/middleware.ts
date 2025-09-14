// middleware.ts (Optional: API rate limiting and logging)
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // Add CORS headers for public API
  if (request.nextUrl.pathname.startsWith("/api/centers-lookup")) {
    const response = NextResponse.next();

    response.headers.set("Access-Control-Allow-Origin", "*");
    response.headers.set("Access-Control-Allow-Methods", "GET");
    response.headers.set("Access-Control-Allow-Headers", "Content-Type");

    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: "/api/:path*",
};
