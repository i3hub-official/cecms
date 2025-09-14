// src/app/api/centers-lookup/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const number = searchParams.get('number');

    if (!number) {
      return NextResponse.json(
        { error: "Center number is required" },
        { status: 400 }
      );
    }

    const center = await prisma.center.findFirst({
      where: {
        number: { equals: number, mode: 'insensitive' },
        isActive: true
      },
      select: {
        id: true,
        number: true,
        name: true,
        address: true,
        state: true,
        lga: true,
        isActive: true
      }
    });

    if (!center) {
      return NextResponse.json(
        { error: "Center not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(center);

  } catch (error) {
    console.error("Center lookup error:", error);
    return NextResponse.json(
      { error: "Failed to lookup center" },
      { status: 500 }
    );
  }
}