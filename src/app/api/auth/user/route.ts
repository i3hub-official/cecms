// app/api/auth/me/route.ts - UPDATED
import { NextRequest, NextResponse } from "next/server";
import { getUserFromCookies } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    console.log("GET /api/auth/user called");
    const user = await getUserFromCookies(request);

    if (!user) {
      console.log("No user found - returning 401");
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    console.log("User found:", user.email);
    return NextResponse.json({
      user: {  // Return in the same format as /api/auth/me
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      }
    });
  } catch (error) {
    console.error("Get user error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}