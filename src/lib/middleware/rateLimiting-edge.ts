// src/lib/middleware/rateLimiting-edge.ts - Edge compatible
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

// Simple in-memory rate limiting for Edge Runtime
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export async function withRateLimiter(
  request: NextRequest,
  options: { interval?: number; limit?: number } = {}
): Promise<NextResponse> {
  const ip = request.headers.get("x-real-ip") ||
             request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
             "unknown";

  const interval = options.interval || 60000; // 1 minute
  const limit = options.limit || 100; // 100 requests per interval

  const key = `rate-limit:${ip}`;
  const now = Date.now();
  
  let record = rateLimitStore.get(key);
  
  if (!record || now > record.resetTime) {
    record = { count: 0, resetTime: now + interval };
  }

  if (record.count >= limit) {
    const response = new NextResponse("Too Many Requests", { status: 429 });
    response.headers.set("X-RateLimit-Limit", limit.toString());
    response.headers.set("X-RateLimit-Remaining", "0");
    response.headers.set("X-RateLimit-Reset", record.resetTime.toString());
    return response;
  }

  record.count++;
  rateLimitStore.set(key, record);

  const response = NextResponse.next();
  response.headers.set("X-RateLimit-Limit", limit.toString());
  response.headers.set("X-RateLimit-Remaining", (limit - record.count).toString());
  response.headers.set("X-RateLimit-Reset", record.resetTime.toString());
  
  return response;
}