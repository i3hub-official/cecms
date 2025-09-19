// src/app/api/auth/validate/route.ts
import { NextRequest, NextResponse } from "next/server";
import { validateSession } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const validationResult = await validateSession(request);

    if (!validationResult.isValid) {
      return NextResponse.json(
        { success: false, error: validationResult.error },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      user: validationResult.user,
      sessionId: validationResult.sessionId,
    });
  } catch (error) {
    console.error("Validation error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}