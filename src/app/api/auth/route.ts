// src/app/api/auth/validate/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getUserFromCookies } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromCookies(request);

    if (!user) {
      return NextResponse.json(
        { isValid: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    return NextResponse.json({
      isValid: true,
      user,
    });
  } catch (error) {
    return NextResponse.json(
      { isValid: false, error: "Validation failed" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromCookies(request);

    if (!user) {
      return NextResponse.json(
        { isValid: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    return NextResponse.json({
      isValid: true,
      user,
    });
  } catch (error) {
    return NextResponse.json(
      { isValid: false, error: "Validation failed" },
      { status: 500 }
    );
  }
}
