// src/app/api/centers/count/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateSession } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    // Validate session
    const authResult = await validateSession(request);
    if (!authResult.isValid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const state = searchParams.get("state");
    const lga = searchParams.get("lga");

    if (!state || !lga) {
      return NextResponse.json(
        { error: "State and LGA are required" },
        { status: 400 }
      );
    }

    const count = await prisma.center.count({
      where: {
        state,
        lga,
        isActive: true,
      },
    });

    return NextResponse.json({ count });
  } catch (error) {
    console.error("Count centers error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
