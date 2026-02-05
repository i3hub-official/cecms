// app/api/centers/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/server/db/index";
import { centers, admins, adminSessions } from "@/lib/server/db/schema";
import { eq, and, not } from "drizzle-orm";
import { jwtVerify } from "jose";

// JWT configuration
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "fallback-secret-change-in-production"
);

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

// Helper function to verify auth token (same as /api/auth/user and /api/dashboard)
async function verifyAuthToken(request: NextRequest) {
  try {
    // Method 1: Check cookies from request
    const tokenFromCookie = request.cookies.get("auth-token")?.value;
    
    if (!tokenFromCookie) {
      // Also check Authorization header as fallback
      const authHeader = request.headers.get("authorization");
      if (authHeader?.startsWith("Bearer ")) {
        const token = authHeader.substring(7);
        return await verifyToken(token);
      }
      return null;
    }

    return await verifyToken(tokenFromCookie);
  } catch (error) {
    console.error("Auth verification error:", error);
    return null;
  }
}

async function verifyToken(token: string) {
  try {
    // Verify JWT
    const { payload } = await jwtVerify(token, JWT_SECRET);
    
    // Check session in database
    const session = await db
      .select()
      .from(adminSessions)
      .where(
        and(
          eq(adminSessions.token, token),
          eq(adminSessions.isActive, true),
          eq(adminSessions.adminId, payload.userId as string)
        )
      )
      .limit(1);

    if (session.length === 0) {
      console.log("No active session found in database");
      return null;
    }

    // Get user details
    const [user] = await db
      .select({
        id: admins.id,
        email: admins.email,
        name: admins.name,
        role: admins.role,
        isEmailVerified: admins.isEmailVerified,
        isActive: admins.isActive,
      })
      .from(admins)
      .where(eq(admins.id, payload.userId as string))
      .limit(1);

    if (!user || !user.isActive) {
      console.log("User not found or inactive");
      return null;
    }

    // Update session last used time
    await db
      .update(adminSessions)
      .set({ lastUsed: new Date() })
      .where(eq(adminSessions.id, session[0].id));

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      isEmailVerified: user.isEmailVerified,
    };
  } catch (error) {
    console.error("Token verification error:", error);
    return null;
  }
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
    
    // Verify authentication
    const user = await verifyAuthToken(request);

    if (!user) {
      console.log("GET center: Unauthorized access attempt");
      return NextResponse.json(
        { 
          error: "Unauthorized",
          message: "Please log in to access center details"
        }, 
        { status: 401 }
      );
    }

    console.log(`GET center ${id}: Authorized access for user ${user.email}`);

    const [center] = await db
      .select()
      .from(centers)
      .where(eq(centers.id, id))
      .limit(1);

    if (!center) {
      console.log(`Center ${id} not found`);
      return NextResponse.json(
        { 
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
      },
    });
  } catch (error) {
    console.error("GET center error:", error);
    return NextResponse.json(
      { 
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
    
    // Verify authentication
    const user = await verifyAuthToken(request);

    if (!user) {
      console.log("PUT center: Unauthorized access attempt");
      return NextResponse.json(
        { 
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
      },
    });
  } catch (error) {
    console.error("PUT center error:", error);
    
    // Handle specific error types
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { 
          error: "Invalid JSON",
          message: "The request body contains invalid JSON"
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
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
    
    // Verify authentication
    const user = await verifyAuthToken(request);

    if (!user) {
      console.log("DELETE center: Unauthorized access attempt");
      return NextResponse.json(
        { 
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
      },
    });
  } catch (error) {
    console.error("DELETE center error:", error);
    return NextResponse.json(
      { 
        error: "Failed to delete center",
        message: "An internal server error occurred"
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/centers/[id] - Alternative to PUT for partial updates
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Verify authentication
    const user = await verifyAuthToken(request);

    if (!user) {
      console.log("PATCH center: Unauthorized access attempt");
      return NextResponse.json(
        { 
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
          error: "Forbidden",
          message: "You do not have permission to update centers"
        }, 
        { status: 403 }
      );
    }

    console.log(`PATCH center ${id}: Authorized access for user ${user.email}`);

    const body = await request.json();
    const updates: Partial<UpdateData> = {
      modifiedBy: user.email,
      modifiedAt: new Date(),
    };

    // Only include fields that are provided in the request
    if (body.number !== undefined) updates.number = body.number;
    if (body.name !== undefined) updates.name = body.name;
    if (body.address !== undefined) updates.address = body.address;
    if (body.state !== undefined) updates.state = body.state;
    if (body.lga !== undefined) updates.lga = body.lga;
    if (body.isActive !== undefined) updates.isActive = body.isActive;

    const [updatedCenter] = await db
      .update(centers)
      .set(updates)
      .where(eq(centers.id, id))
      .returning();

    if (!updatedCenter) {
      return NextResponse.json(
        { 
          error: "Center not found",
          message: "The center you are trying to update does not exist"
        }, 
        { status: 404 }
      );
    }

    console.log(`Center ${id} partially updated by ${user.email}`);
    
    return NextResponse.json({
      success: true,
      message: "Center updated successfully",
      data: updatedCenter,
    });
  } catch (error) {
    console.error("PATCH center error:", error);
    return NextResponse.json(
      { 
        error: "Failed to update center",
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
        "Access-Control-Allow-Methods": "GET, PUT, DELETE, PATCH, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization, Cookie",
        "Access-Control-Allow-Credentials": "true",
        "Access-Control-Max-Age": "86400",
      },
    }
  );
}