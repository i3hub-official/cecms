// src/app/api/centers/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateSession } from "@/lib/auth";

// GET /api/centers - fetch centers with optional search and pagination
export async function GET(request: NextRequest) {
  try {
    const authResult = await validateSession(request);
    if (!authResult.isValid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";
    const includeInactive = searchParams.get("includeInactive") === "true";
    const skip = (page - 1) * limit;

    // Build where clause using Prisma.CenterWhereInput
    const where: NonNullable<Parameters<typeof prisma.center.findMany>[0]>["where"] = {};

    if (!includeInactive) where.isActive = true;

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { number: { contains: search, mode: "insensitive" } },
        { address: { contains: search, mode: "insensitive" } },
        { state: { contains: search, mode: "insensitive" } },
        { lga: { contains: search, mode: "insensitive" } },
      ];
    }

    const [centers, total] = await Promise.all([
      prisma.center.findMany({
        where,
        skip,
        take: limit,
        orderBy: { modifiedAt: "desc" },
      }),
      prisma.center.count({ where }),
    ]);

    const pages = Math.ceil(total / limit);

    return NextResponse.json({
      centers,
      pagination: { page, limit, total, pages },
    });
  } catch (error) {
    console.error("Centers GET API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch centers" },
      { status: 500 }
    );
  }
}

// POST /api/centers - create a new center
export async function POST(request: NextRequest) {
  try {
    const authResult = await validateSession(request);
    if (!authResult.isValid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: {
      number: string;
      name: string;
      address: string;
      state: string;
      lga: string;
      isActive?: boolean;
    } = await request.json();

    const { number, name, address, state, lga, isActive = true } = body;

    // Check if the center number already exists
    const existingCenter = await prisma.center.findUnique({
      where: { number },
    });
    if (existingCenter) {
      return NextResponse.json(
        { error: "Center number already exists" },
        { status: 400 }
      );
    }

    // Create center, Prisma infers type automatically
    const center = await prisma.center.create({
      data: {
        number,
        name,
        address,
        state,
        lga,
        isActive,
        createdBy: authResult.user?.email || "system",
        modifiedBy: authResult.user?.email || "system",
      },
    });

    return NextResponse.json(center);
  } catch (error) {
    console.error("Centers POST API error:", error);
    return NextResponse.json(
      { error: "Failed to create center" },
      { status: 500 }
    );
  }
}
