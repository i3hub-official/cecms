import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    message: "Public API endpoint",
    data: {
      version: "1.0.0",
      status: "public",
    },
  });
}
