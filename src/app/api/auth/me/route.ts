// app/api/auth/me/route.ts - TEMPORARY REDIRECT
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  // Redirect to /api/auth/user
  return NextResponse.redirect(new URL('/api/auth/user', request.url));
}