// src/app/api/auth/validate/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getUserFromCookies } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    // Get user from cookies
    const user = await getUserFromCookies(request);
    
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid session",
        },
        { status: 401 }
      );
    }

    const response = NextResponse.json({
      success: true,
      user: user,
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