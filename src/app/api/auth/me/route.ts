// app/api/auth/user/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getUserFromCookies } from "@/lib/auth"; // Your existing function

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromCookies(request);

    if (!user) {
      return NextResponse.json(null, { status: 401 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("Get user error:", error);
    return NextResponse.json(null, { status: 500 });
  }
}
