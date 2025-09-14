// src/app/api/centers/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateSession } from "@/lib/auth";

interface RouteParams {
  params: { id: string };
}

// GET /api/centers/[id] - Get specific center
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await validateSession(request);
    if (!authResult.isValid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const center = await prisma.center.findUnique({
      where: { id: params.id },
    });

    if (!center) {
      return NextResponse.json({ error: "Center not found" }, { status: 404 });
    }

    return NextResponse.json(center);
  } catch (error) {
    console.error("Get center error:", error);
    return NextResponse.json(
      { error: "Failed to fetch center" },
      { status: 500 }
    );
  }
}

// PUT /api/centers/[id] - Update center
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await validateSession(request);
    if (!authResult.isValid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { number, name, address, state, lga, isActive } = body;

    // Check if number is being changed and if it already exists
    if (number) {
      const existingCenter = await prisma.center.findFirst({
        where: {
          number,
          id: { not: params.id },
        },
      });

      if (existingCenter) {
        return NextResponse.json(
          { error: "Center number already exists" },
          { status: 400 }
        );
      }
    }

    const center = await prisma.center.update({
      where: { id: params.id },
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

    return NextResponse.json(center);
  } catch (error) {
    console.error("Update center error:", error);
    return NextResponse.json(
      { error: "Failed to update center" },
      { status: 500 }
    );
  }
}

// DELETE /api/centers/[id] - Delete (deactivate) center
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await validateSession(request);
    if (!authResult.isValid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Soft delete (deactivate) instead of hard delete
    const center = await prisma.center.update({
      where: { id: params.id },
      data: {
        isActive: false,
        modifiedBy: authResult.user?.email || "system",
        modifiedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Center deactivated successfully",
    });
  } catch (error) {
    console.error("Delete center error:", error);
    return NextResponse.json(
      { error: "Failed to delete center" },
      { status: 500 }
    );
  }
}
