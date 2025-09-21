// File: src/lib/middleware/rateLimiting.ts
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { rateLimit } from "@/lib/middleware/rateLimit";

// 🔧 Environment-based defaults
const isDev = process.env.NODE_ENV !== "production";

// In dev → allow way more requests, shorter window (or even disable)
// In prod → stricter
const DEFAULT_INTERVAL = isDev ? 60 * 1000 : 15 * 60 * 1000; // 1 min (dev) vs 15 min (prod)
const DEFAULT_LIMIT = isDev ? 1000 : 100; // 1000 requests (dev) vs 100 (prod)

export async function withRateLimiter(
  request: NextRequest,
  options?: { interval?: number; limit?: number }
): Promise<NextResponse> {
  const ip =
    request.headers.get("x-real-ip") ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || // Standard header for proxies
    "192.168.0.159"; // fallback for local dev

  const { success, limit, remaining, reset } = await rateLimit({
    interval: options?.interval ?? DEFAULT_INTERVAL,
    limit: options?.limit ?? DEFAULT_LIMIT,
    uniqueId: ip,
    namespace: "ip",
  });

  const response = success
    ? NextResponse.next()
    : new NextResponse("Too many requests", { status: 429 });

  // ✅ Standardized rate-limit headers
  response.headers.set("X-RateLimit-Limit", limit.toString());
  response.headers.set("X-RateLimit-Remaining", remaining.toString());
  response.headers.set("X-RateLimit-Reset", new Date(reset).toISOString());
  response.headers.set("X-RateLimit-Used", (limit - remaining).toString());
  response.headers.set(
    "X-RateLimit-Policy",
    `${(options?.interval ?? DEFAULT_INTERVAL) / 60000} minutes`
  );
  response.headers.set("X-RateLimit-Bypass", success ? "false" : "true");
  response.headers.set("X-RateLimit-Client-IP", ip);

  return response;
}
