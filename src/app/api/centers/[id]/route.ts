// src/app/api/centers/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/server/db/index";
import { centers } from "@/lib/server/db/schema";
import { getUserFromCookies } from "@/lib/auth";
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
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Get user from cookies using the simplified auth
    const user = await getUserFromCookies(request);

    if (!user) {
      console.log("GET center: Unauthorized access attempt");
      return NextResponse.json(
        { 
          success: false,
          error: "Unauthorized",
          message: "Please log in to access center details"
        }, 
        { status: 401 }
      );
    }

    console.log(`GET center ${id}: Authorized access for user ${user.email} (${user.role})`);

    const [center] = await db
      .select()
      .from(centers)
      .where(eq(centers.id, id))
      .limit(1);

    if (!center) {
      console.log(`Center ${id} not found`);
      return NextResponse.json(
        { 
          success: false,
          error: "Center not found",
          message: "The requested center does not exist"
        }, 
        { status: 404 }
      );
    }

    // Return center data with user context
    return NextResponse.json({
      success: true,
      data: center,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
      },
    });
  } catch (error) {
    console.error("GET center error:", error);
    return NextResponse.json(
      { 
        success: false,
        error: "Failed to fetch center",
        message: "An internal server error occurred"
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/centers/[id]
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Get user from cookies using the simplified auth
    const user = await getUserFromCookies(request);

    if (!user) {
      console.log("PUT center: Unauthorized access attempt");
      return NextResponse.json(
        { 
          success: false,
          error: "Unauthorized",
          message: "Please log in to update center details"
        }, 
        { status: 401 }
      );
    }

    // Check if user has permission to update centers
    if (user.role !== 'admin' && user.role !== 'superadmin') {
      return NextResponse.json(
        { 
          success: false,
          error: "Forbidden",
          message: "You do not have permission to update centers"
        }, 
        { status: 403 }
      );
    }

    console.log(`PUT center ${id}: Authorized access for user ${user.email} (${user.role})`);

    const body = await request.json();
    const { number, name, address, state, lga, isActive } = body;

    // Validate required fields
    const validationErrors: string[] = [];
    
    if (number !== undefined && (!number || number.trim().length < 3)) {
      validationErrors.push("Center number must be at least 3 characters");
    }
    
    if (name !== undefined && (!name || name.trim().length < 2)) {
      validationErrors.push("Center name must be at least 2 characters");
    }
    
    if (validationErrors.length > 0) {
      return NextResponse.json(
        { 
          success: false,
          error: "Validation failed",
          message: "Please correct the following errors",
          errors: validationErrors
        }, 
        { status: 400 }
      );
    }

    // Check if center exists before update
    const [existingCenter] = await db
      .select()
      .from(centers)
      .where(eq(centers.id, id))
      .limit(1);

    if (!existingCenter) {
      console.log(`Center ${id} not found for update`);
      return NextResponse.json(
        { 
          success: false,
          error: "Center not found",
          message: "The center you are trying to update does not exist"
        }, 
        { status: 404 }
      );
    }

    // Prevent duplicate center number
    if (number && number !== existingCenter.number) {
      const [duplicate] = await db
        .select()
        .from(centers)
        .where(eq(centers.number, number))
        .limit(1);

      if (duplicate) {
        return NextResponse.json(
          { 
            success: false,
            error: "Duplicate center number",
            message: `Center number ${number} is already assigned to another center`
          },
          { status: 400 }
        );
      }
    }

    const updateData: UpdateData = {
      modifiedBy: user.email,
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
      return NextResponse.json(
        { 
          success: false,
          error: "Update failed",
          message: "Failed to update center"
        }, 
        { status: 500 }
      );
    }

    console.log(`Center ${id} updated successfully by ${user.email}`);
    
    return NextResponse.json({
      success: true,
      message: "Center updated successfully",
      data: updatedCenter,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
      },
    });
  } catch (error) {
    console.error("PUT center error:", error);
    
    // Handle specific error types
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { 
          success: false,
          error: "Invalid JSON",
          message: "The request body contains invalid JSON"
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        success: false,
        error: "Failed to update center",
        message: "An internal server error occurred"
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/centers/[id]
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Get user from cookies using the simplified auth
    const user = await getUserFromCookies(request);

    if (!user) {
      console.log("DELETE center: Unauthorized access attempt");
      return NextResponse.json(
        { 
          success: false,
          error: "Unauthorized",
          message: "Please log in to delete centers"
        }, 
        { status: 401 }
      );
    }

    // Check if user has permission to delete centers
    if (user.role !== 'superadmin') {
      return NextResponse.json(
        { 
          success: false,
          error: "Forbidden",
          message: "Only superadmins can delete centers"
        }, 
        { status: 403 }
      );
    }

    console.log(`DELETE center ${id}: Authorized access for superadmin ${user.email}`);

    // Check if center exists before deletion
    const [existingCenter] = await db
      .select()
      .from(centers)
      .where(eq(centers.id, id))
      .limit(1);

    if (!existingCenter) {
      console.log(`Center ${id} not found for deletion`);
      return NextResponse.json(
        { 
          success: false,
          error: "Center not found",
          message: "The center you are trying to delete does not exist"
        }, 
        { status: 404 }
      );
    }

    // Soft delete (mark as inactive) instead of hard delete
    const [updatedCenter] = await db
      .update(centers)
      .set({
        isActive: false,
        modifiedBy: user.email,
        modifiedAt: new Date(),
      })
      .where(eq(centers.id, id))
      .returning();

    if (!updatedCenter) {
      return NextResponse.json(
        { 
          success: false,
          error: "Deletion failed",
          message: "Failed to delete center"
        }, 
        { status: 500 }
      );
    }

    console.log(`Center ${id} marked as inactive by superadmin ${user.email}`);
    
    return NextResponse.json({
      success: true,
      message: "Center deactivated successfully",
      data: updatedCenter,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
      },
    });
  } catch (error) {
    console.error("DELETE center error:", error);
    return NextResponse.json(
      { 
        success: false,
        error: "Failed to delete center",
        message: "An internal server error occurred"
      },
      { status: 500 }
    );
  }
}

// Handle OPTIONS for CORS
export async function OPTIONS() {
  return NextResponse.json(
    {},
    {
      status: 200,
      headers: {
        "Access-Control-Allow-Methods": "GET, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization, Cookie",
        "Access-Control-Allow-Credentials": "true",
        "Access-Control-Max-Age": "86400",
      },
    }
  );
}