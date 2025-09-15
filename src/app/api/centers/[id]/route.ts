// src/app/api/centers/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateSession } from "@/lib/auth";

/**
 * GET /api/centers/[id]
 * Fetch a single center by ID
 */
export async function GET(
  request: NextRequest,
  context: { params: { id: string } }
) {
  const { id } = context.params;

  try {
    const authResult = await validateSession(request);
    if (!authResult.isValid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const center = await prisma.center.findUnique({ where: { id } });
    if (!center) {
      return NextResponse.json({ error: "Center not found" }, { status: 404 });
    }

    return NextResponse.json(center);
  } catch (error) {
    console.error("GET center error:", error);
    return NextResponse.json(
      { error: "Failed to fetch center" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/centers/[id]
 * Update a center
 */
export async function PUT(
  request: NextRequest,
  context: { params: { id: string } }
) {
  const { id } = context.params;

  try {
    const authResult = await validateSession(request);
    if (!authResult.isValid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { number, name, address, state, lga, isActive } = body;

    // Prevent duplicate center number
    if (number) {
      const existing = await prisma.center.findFirst({
        where: { number, id: { not: id } },
      });
      if (existing) {
        return NextResponse.json(
          { error: "Center number already exists" },
          { status: 400 }
        );
      }
    }

    const updatedCenter = await prisma.center.update({
      where: { id },
      data: {
        ...(number && { number }),
        ...(name && { name }),
        ...(address && { address }),
        ...(state && { state }),
        ...(lga && { lga }),
        ...(isActive !== undefined && { isActive }),
        modifiedBy: authResult.user?.email || "system",
        modifiedAt: new Date(),
      },
    });

    return NextResponse.json(updatedCenter);
  } catch (error) {
    console.error("PUT center error:", error);
    return NextResponse.json(
      { error: "Failed to update center" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/centers/[id]
 * Soft-delete (deactivate) a center
 */
export async function DELETE(
  request: NextRequest,
  context: { params: { id: string } }
) {
  const { id } = context.params;

  try {
    const authResult = await validateSession(request);
    if (!authResult.isValid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const center = await prisma.center.update({
      where: { id },
      data: {
        isActive: false,
        modifiedBy: authResult.user?.email || "system",
        modifiedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Center deactivated successfully",
      center,
    });
  } catch (error) {
    console.error("DELETE center error:", error);
    return NextResponse.json(
      { error: "Failed to delete center" },
      { status: 500 }
    );
  }
}
