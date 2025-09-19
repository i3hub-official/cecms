// File: src/app/api/auth/forgot-password/route.ts
import { NextRequest, NextResponse } from "next/server";
import { passwordService } from "@/lib/services/password";
import { rateLimitByIp } from "@/lib/middleware/rateLimit";

export async function POST(request: NextRequest) {
  try {
    // Rate limiting - 3 requests per hour per IP
    const rateLimitResult = await rateLimitByIp(request, {
      interval: 60 * 60 * 1000, // 1 hour
      limit: 3
    });

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429, headers: { 'Retry-After': '3600' } }
      );
    }

    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    const result = await passwordService.requestPasswordReset(email);

    if (!result.success) {
      return NextResponse.json(
        { error: result.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}