// src/app/apis/v1/user/api-key/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/server/db/index";
import { apiKeys, adminActivities } from "@/lib/server/db/schema";
import { eq, and } from "drizzle-orm";
import { validateSession } from "@/lib/auth";

// GET - Get a specific API key
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await validateSession(request);

    if (!session.isValid || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const apiKeyId = params.id;

    // Fetch specific API key
    const [apiKey] = await db
      .select({
        id: apiKeys.id,
        name: apiKeys.name,
        description: apiKeys.description,
        prefix: apiKeys.prefix,
        canRead: apiKeys.canRead,
        canWrite: apiKeys.canWrite,
        canDelete: apiKeys.canDelete,
        allowedEndpoints: apiKeys.allowedEndpoints,
        rateLimit: apiKeys.rateLimit,
        isActive: apiKeys.isActive,
        expiresAt: apiKeys.expiresAt,
        revokedAt: apiKeys.revokedAt,
        createdAt: apiKeys.createdAt,
        lastUsed: apiKeys.lastUsed,
        usageCount: apiKeys.usageCount,
      })
      .from(apiKeys)
      .where(
        and(eq(apiKeys.id, apiKeyId), eq(apiKeys.adminId, session.user.id))
      );

    if (!apiKey) {
      return NextResponse.json({ error: "API key not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: apiKey,
    });
  } catch (error) {
    console.error("GET /apis/v1/user/api-key/[id] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH - Update an API key
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await validateSession(request);

    if (!session.isValid || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const apiKeyId = params.id;
    const updates = await request.json();

    // Verify the API key belongs to the user
    const [existingKey] = await db
      .select()
      .from(apiKeys)
      .where(
        and(eq(apiKeys.id, apiKeyId), eq(apiKeys.adminId, session.user.id))
      );

    if (!existingKey) {
      return NextResponse.json({ error: "API key not found" }, { status: 404 });
    }

    // Update the API key
    const [updatedKey] = await db
      .update(apiKeys)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(apiKeys.id, apiKeyId))
      .returning();

    // Log admin activity
    await db.insert(adminActivities).values({
      id: crypto.randomUUID(),
      adminId: session.user.id,
      activity: `API_KEY_UPDATED: ${existingKey.name}`,
      timestamp: new Date(),
    });

    // Remove sensitive data from response
    const { key: _, ...safeApiKey } = updatedKey;

    return NextResponse.json({
      success: true,
      data: safeApiKey,
      message: "API key updated successfully",
    });
  } catch (error) {
    console.error("PATCH /apis/v1/user/api-key/[id] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE - Revoke an API key (if you want to add it here too)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await validateSession(request);
    
    if (!session.isValid || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const apiKeyId = params.id;

    // Verify the API key belongs to the user
    const [apiKey] = await db
      .select()
      .from(apiKeys)
      .where(
        and(
          eq(apiKeys.id, apiKeyId),
          eq(apiKeys.adminId, session.user.id)
        )
      );

    if (!apiKey) {
      return NextResponse.json({ error: "API key not found" }, { status: 404 });
    }

    // Soft delete by setting isActive to false
    await db
      .update(apiKeys)
      .set({
        isActive: false,
        revokedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(apiKeys.id, apiKeyId));

    // Log admin activity
    await db.insert(adminActivities).values({
      id: crypto.randomUUID(),
      adminId: session.user.id,
      activity: `API_KEY_REVOKED: ${apiKey.name}`,
      timestamp: new Date(),
    });

    return NextResponse.json({
      success: true,
      message: "API key revoked successfully",
    });

  } catch (error) {
    console.error("DELETE /apis/v1/user/api-key/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}