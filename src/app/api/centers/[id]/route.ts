// src/app/api/centers/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/server/db/index";
import { centers } from "@/lib/server/db/schema";
import { validateSession } from "@/lib/auth";
import { eq, and, not } from "drizzle-orm";

interface UpdateData {
  number?: string;
  name?: string;
  address?: string;
  state?: string;
  lga?: string;
  isActive?: boolean;
  modifiedBy: string;
  modifiedAt: Date;
}

/**
 * GET /api/centers/[id]
 * Fetch a single center by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const authResult = await validateSession(request);
    if (!authResult.isValid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [center] = await db
      .select()
      .from(centers)
      .where(eq(centers.id, id))
      .limit(1);

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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const authResult = await validateSession(request);
    if (!authResult.isValid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { number, name, address, state, lga, isActive } = body;

    // Prevent duplicate center number
    if (number) {
      const [existing] = await db
        .select()
        .from(centers)
        .where(and(eq(centers.number, number), not(eq(centers.id, id))))
        .limit(1);

      if (existing) {
        return NextResponse.json(
          { error: "Center number already exists" },
          { status: 400 }
        );
      }
    }

    // Build update data dynamically
    const updateData: UpdateData = {
      modifiedBy: authResult.user?.email || "system",
      modifiedAt: new Date(),
    };

    if (number !== undefined) updateData.number = number;
    if (name !== undefined) updateData.name = name;
    if (address !== undefined) updateData.address = address;
    if (state !== undefined) updateData.state = state;
    if (lga !== undefined) updateData.lga = lga;
    if (isActive !== undefined) updateData.isActive = isActive;

    const [updatedCenter] = await db
      .update(centers)
      .set(updateData)
      .where(eq(centers.id, id))
      .returning();

    if (!updatedCenter) {
      return NextResponse.json({ error: "Center not found" }, { status: 404 });
    }

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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const authResult = await validateSession(request);
    if (!authResult.isValid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [center] = await db
      .update(centers)
      .set({
        isActive: false,
        modifiedBy: authResult.user?.email || "system",
        modifiedAt: new Date(),
      })
      .where(eq(centers.id, id))
      .returning();

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
