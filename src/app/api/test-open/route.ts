// src/app/api/test-open/route.ts
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ success: true, message: "No auth here" });
}
