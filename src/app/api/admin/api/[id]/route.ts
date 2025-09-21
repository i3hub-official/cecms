
// src/app/api/keys/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/server/db";
import { apiKeys, apiUsageLogs } from "@/lib/server/db/schema";
import { validateSession } from "@/lib/auth";
import { eq, and, desc } from "drizzle-orm";

// GET - Get specific API key details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: keyId } = await params;

    // Validate admin session
    const authResult = await validateSession(request);
    if (!authResult.isValid) {
      return NextResponse.json(
        { success: false, error: "Unauthorized", details: authResult.error },
        { status: 401 }
      );
    }

    if (!authResult.user) {
      return NextResponse.json(
        { success: false, error: "Invalid user session" },
        { status: 400 }
      );
    }

    // Verify the API key belongs to the current admin
    const apiKey = await db
      .select({
        id: apiKeys.id,
        prefix: apiKeys.prefix,
        name: apiKeys.name,
        description: apiKeys.description,
        canRead: apiKeys.canRead,
        canWrite: apiKeys.canWrite,
        canDelete: apiKeys.canDelete,
        canManageKeys: apiKeys.canManageKeys,
        allowedEndpoints: apiKeys.allowedEndpoints,
        rateLimit: apiKeys.rateLimit,
        rateLimitPeriod: apiKeys.rateLimitPeriod,
        isActive: apiKeys.isActive,
        expiresAt: apiKeys.expiresAt,
        revokedAt: apiKeys.revokedAt,
        createdAt: apiKeys.createdAt,
        lastUsed: apiKeys.lastUsed,
        usageCount: apiKeys.usageCount,
      })
      .from(apiKeys)
      .where(
        and(
          eq(apiKeys.id, keyId),
          eq(apiKeys.adminId, authResult.user.id)
        )
      )
      .limit(1);

    if (apiKey.length === 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: "API key not found",
          details: "The specified API key does not exist or you don't have permission to access it"
        },
        { status: 404 }
      );
    }

    // Get recent usage logs for this API key
    const recentUsage = await db
      .select({
        endpoint: apiUsageLogs.endpoint,
        method: apiUsageLogs.method,
        statusCode: apiUsageLogs.statusCode,
        ipAddress: apiUsageLogs.ipAddress,
        createdAt: apiUsageLogs.createdAt,
      })
      .from(apiUsageLogs)
      .where(eq(apiUsageLogs.apiKeyId, keyId))
      .orderBy(desc(apiUsageLogs.createdAt))
      .limit(10);

    return NextResponse.json({
      success: true,
      data: {
        ...apiKey[0],
        recentUsage,
      },
    });
  } catch (error) {
    console.error("API Key GET error:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to fetch API key details",
        details: process.env.NODE_ENV === "development" && error instanceof Error
          ? error.message
          : undefined,
      },
      { status: 500 }
    );
  }
}

// PUT - Update API key
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: keyId } = await params;

    // Validate admin session
    const authResult = await validateSession(request);
    if (!authResult.isValid) {
      return NextResponse.json(
        { success: false, error: "Unauthorized", details: authResult.error },
        { status: 401 }
      );
    }

    if (!authResult.user) {
      return NextResponse.json(
        { success: false, error: "Invalid user session" },
        { status: 400 }
      );
    }

    // Verify the API key belongs to the current admin
    const existingKey = await db
      .select()
      .from(apiKeys)
      .where(
        and(
          eq(apiKeys.id, keyId),
          eq(apiKeys.adminId, authResult.user.id)
        )
      )
      .limit(1);

    if (existingKey.length === 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: "API key not found",
          details: "The specified API key does not exist or you don't have permission to access it"
        },
        { status: 404 }
      );
    }

    const body = await request.json();
    const {
      name,
      description,
      canRead,
      canWrite,
      canDelete,
      canManageKeys,
      allowedEndpoints,
      rateLimit,
      rateLimitPeriod,
      expiresAt,
    } = body;

    // Validate name if provided
    if (name !== undefined) {
      if (!name || name.trim().length === 0) {
        return NextResponse.json(
          { success: false, error: "API key name cannot be empty" },
          { status: 400 }
        );
      }

      if (name.length > 100) {
        return NextResponse.json(
          { success: false, error: "API key name must be less than 100 characters" },
          { status: 400 }
        );
      }

      // Check if another API key with this name exists
      if (name.trim() !== existingKey[0].name) {
        const duplicateName = await db
          .select()
          .from(apiKeys)
          .where(
            and(
              eq(apiKeys.adminId, authResult.user.id),
              eq(apiKeys.name, name.trim()),
              eq(apiKeys.isActive, true)
            )
          )
          .limit(1);

        if (duplicateName.length > 0) {
          return NextResponse.json(
            { success: false, error: "An API key with this name already exists" },
            { status: 409 }
          );
        }
      }
    }

    // Validate expiration date if provided
    let expirationDate: Date | null | undefined = undefined;
    if (expiresAt !== undefined) {
      if (expiresAt) {
        expirationDate = new Date(expiresAt);
        if (expirationDate <= new Date()) {
          return NextResponse.json(
            { success: false, error: "Expiration date must be in the future" },
            { status: 400 }
          );
        }
      } else {
        expirationDate = null; // Allow setting to null to remove expiration
      }
    }

    // Build update object with only provided fields
    interface UpdateData {
      name?: string;
      description?: string | null;
      canRead?: boolean;
      canWrite?: boolean;
      canDelete?: boolean;
      canManageKeys?: boolean;
      allowedEndpoints?: string[];
      rateLimit?: number;
      rateLimitPeriod?: number;
      expiresAt?: Date | null;
      updatedAt: Date;
    }

    const updateData: UpdateData = { updatedAt: new Date() };
    
    if (name !== undefined) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description?.trim() || null;
    if (canRead !== undefined) updateData.canRead = canRead;
    if (canWrite !== undefined) updateData.canWrite = canWrite;
    if (canDelete !== undefined) updateData.canDelete = canDelete;
    if (canManageKeys !== undefined) updateData.canManageKeys = canManageKeys;
    if (allowedEndpoints !== undefined) updateData.allowedEndpoints = allowedEndpoints;
    if (rateLimit !== undefined) updateData.rateLimit = Math.max(1, Math.min(10000, rateLimit));
    if (rateLimitPeriod !== undefined) updateData.rateLimitPeriod = Math.max(1, Math.min(3600, rateLimitPeriod));
    if (expirationDate !== undefined) updateData.expiresAt = expirationDate;

    // Update API key
    const updatedKey = await db
      .update(apiKeys)
      .set({
        ...updateData,
        allowedEndpoints: updateData.allowedEndpoints ? JSON.stringify(updateData.allowedEndpoints) : undefined,
      })
      .where(eq(apiKeys.id, keyId))
      .returning();

    return NextResponse.json({
      success: true,
      data: {
        id: updatedKey[0].id,
        prefix: updatedKey[0].prefix,
        name: updatedKey[0].name,
        description: updatedKey[0].description,
        permissions: {
          canRead: updatedKey[0].canRead,
          canWrite: updatedKey[0].canWrite,
          canDelete: updatedKey[0].canDelete,
          canManageKeys: updatedKey[0].canManageKeys,
        },
        allowedEndpoints: updatedKey[0].allowedEndpoints,
        rateLimit: updatedKey[0].rateLimit,
        rateLimitPeriod: updatedKey[0].rateLimitPeriod,
        expiresAt: updatedKey[0].expiresAt,
        updatedAt: updatedKey[0].updatedAt,
      },
      message: "API key updated successfully",
    });
  } catch (error) {
    console.error("API Key PUT error:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to update API key",
        details: process.env.NODE_ENV === "development" && error instanceof Error
          ? error.message
          : undefined,
      },
      { status: 500 }
    );
  }
}

// DELETE - Revoke/delete API key
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: keyId } = await params;

    // Validate admin session
    const authResult = await validateSession(request);
    if (!authResult.isValid) {
      return NextResponse.json(
        { success: false, error: "Unauthorized", details: authResult.error },
        { status: 401 }
      );
    }

    if (!authResult.user) {
      return NextResponse.json(
        { success: false, error: "Invalid user session" },
        { status: 400 }
      );
    }

    // Verify the API key belongs to the current admin
    const apiKey = await db
      .select()
      .from(apiKeys)
      .where(
        and(
          eq(apiKeys.id, keyId),
          eq(apiKeys.adminId, authResult.user.id)
        )
      )
      .limit(1);

    if (apiKey.length === 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: "API key not found",
          details: "The specified API key does not exist or you don't have permission to access it"
        },
        { status: 404 }
      );
    }

    // Revoke the API key (soft delete)
    await db
      .update(apiKeys)
      .set({ 
        isActive: false,
        revokedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(apiKeys.id, keyId));

    return NextResponse.json({
      success: true,
      message: "API key revoked successfully",
    });
  } catch (error) {
    console.error("API Key DELETE error:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to revoke API key",
        details: process.env.NODE_ENV === "development" && error instanceof Error
          ? error.message
          : undefined,
      },
      { status: 500 }
    );
  }
}
