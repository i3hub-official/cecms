// File: src/lib/middleware/securityHeaders.ts - UPDATED WITH DEBUGGING
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getCspConfig, generateCspHeader } from "../security/cspConfig"; // Add import

export function withSecurityHeaders(req: NextRequest) {
  const res = NextResponse.next();

  // Debug logging
  console.log("=== SECURITY HEADERS MIDDLEWARE ===");
  console.log("Path:", req.nextUrl.pathname);
  console.log("Environment:", process.env.NODE_ENV);

  // Core Security Headers
  res.headers.set("X-Frame-Options", "DENY");
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  res.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), payment=()"
  );
  res.headers.set(
    "Strict-Transport-Security",
    "max-age=63072000; includeSubDomains; preload"
  );
  res.headers.set("X-XSS-Protection", "1; mode=block");

  // ✅ Generate CSP using the helper function
  const cspConfig = getCspConfig();
  const cspDirectives = generateCspHeader(cspConfig);
  
  // Debug: Log the CSP header
  console.log("Generated CSP Header:", cspDirectives);
  console.log("CSP Config keys:", Object.keys(cspConfig));
  
  // Check if connect-src has wildcards
  if (cspConfig.connectSrc && Array.isArray(cspConfig.connectSrc)) {
    console.log("connect-src values:", cspConfig.connectSrc);
    const hasWildcards = cspConfig.connectSrc.some(src => 
      src.includes('*') || src.includes('10.') || src.includes('localhost')
    );
    console.log("Has wildcards for local network:", hasWildcards);
  }

  res.headers.set("Content-Security-Policy", cspDirectives);
  res.headers.set("X-Content-Security-Policy", cspDirectives);
  res.headers.set("X-WebKit-CSP", cspDirectives);

  return res;
}