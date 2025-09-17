// src/app/api/auth/validate/route.ts
import { NextRequest, NextResponse } from "next/server";
import { validateSession } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const validationResult = await validateSession(request);

    if (!validationResult.isValid || !validationResult.user) {
      return NextResponse.json(
        {
          success: false,
          error: validationResult.error || "Invalid session",
        },
        { status: 401 }
      );
    }

    const response = NextResponse.json({
      success: true,
      user: validationResult.user,
    });

    response.headers.set("Cache-Control", "no-store, max-age=0");
    return response;
  } catch (error) {
    console.error("Session validation error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
