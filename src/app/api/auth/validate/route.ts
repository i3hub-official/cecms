// src/app/api/auth/validate/route.ts - For full DB validation
import { NextRequest, NextResponse } from "next/server";
import { validateSession } from "@/lib/auth"; // This can use DB (Node.js runtime)

export async function GET(request: NextRequest) {
  try {
    const session = await validateSession(request);
    return NextResponse.json(session);
  } catch (error) {
    return NextResponse.json({ error: "Validation failed" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await validateSession(request);
    return NextResponse.json(session);
  } catch (error) {
    return NextResponse.json({ error: "Validation failed" }, { status: 500 });
  }
}
