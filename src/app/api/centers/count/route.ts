// src/app/api/centers/count/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateSession } from "@/lib/auth";

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const authResult = await validateSession(request);
    if (!authResult.isValid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const state = url.searchParams.get("state")?.trim();
    const lga = url.searchParams.get("lga")?.trim();

    if (!state || !lga) {
      return NextResponse.json(
        { error: "State and LGA are required" },
        { status: 400 }
      );
    }

    const count = await prisma.center.count({
      where: { state, lga, isActive: true },
    });

    return NextResponse.json({ count });
  } catch (error) {
    console.error(
      "Count centers error:",
      error instanceof Error ? error.message : error
    );
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
