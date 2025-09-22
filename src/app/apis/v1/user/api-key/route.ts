// src/app/apis/v1/user/api-key/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/server/db/index";
import { apiKeys, adminActivities } from "@/lib/server/db/schema";
import { eq, and } from "drizzle-orm";
import { getUserFromCookies } from "@/lib/auth";
import { hashToken, generateSecureToken } from "@/lib/utils/tokens";

// GET - Fetch all API keys for the authenticated user
export async function GET(request: NextRequest) {
  try {
    // Get user from cookies
    const user = await getUserFromCookies(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch user's API keys with sensitive data removed
    const userApiKeys = await db
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
      .where(and(eq(apiKeys.adminId, user.id), eq(apiKeys.isActive, true)))
      .orderBy(apiKeys.createdAt);

    return NextResponse.json({
      success: true,
      data: userApiKeys,
    });
  } catch (error) {
    console.error("GET /apis/v1/user/api-key error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Create a new API key
export async function POST(request: NextRequest) {
  try {
    // Get user from cookies
    const user = await getUserFromCookies(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      description,
      canRead = true,
      canWrite = false,
      canDelete = false,
      allowedEndpoints = "*",
      rateLimit = 100,
      expiresInDays = 365,
    } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    if (!canRead && !canWrite && !canDelete) {
      return NextResponse.json(
        { error: "At least one permission must be selected" },
        { status: 400 }
      );
    }

    // Generate API key
    const token = generateSecureToken(32);
    const prefix = token.slice(0, 8);
    const hashedToken = await hashToken(token);

    const expiresAt = new Date(
      Date.now() + expiresInDays * 24 * 60 * 60 * 1000
    );

    // Create API key in database
    const [newApiKey] = await db
      .insert(apiKeys)
      .values({
        id: crypto.randomUUID(),
        key: hashedToken,
        prefix,
        name: name.trim(),
        description: description?.trim() || null,
        adminId: user.id,
        canRead,
        canWrite,
        canDelete,
        allowedEndpoints,
        rateLimit,
        rateLimitPeriod: 3600, // 1 hour in seconds
        expiresAt,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    // Log admin activity
    await db.insert(adminActivities).values({
      id: crypto.randomUUID(),
      adminId: user.id,
      activity: `API_KEY_CREATED: ${name}`,
      timestamp: new Date(),
    });

    // Return response with the actual token (only shown once)
    return NextResponse.json({
      success: true,
      data: {
        id: newApiKey.id,
        name: newApiKey.name,
        apiKey: token, // The actual token - only returned once!
        prefix: newApiKey.prefix,
        expiresAt: newApiKey.expiresAt,
        createdAt: newApiKey.createdAt,
      },
    });
  } catch (error) {
    console.error("POST /apis/v1/user/api-key error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE - Revoke an API key
export async function DELETE(request: NextRequest) {
  try {
    // Get user from cookies
    const user = await getUserFromCookies(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { apiKeyId } = await request.json();

    if (!apiKeyId) {
      return NextResponse.json(
        { error: "API key ID is required" },
        { status: 400 }
      );
    }

    // Verify the API key belongs to the user
    const [apiKey] = await db
      .select()
      .from(apiKeys)
      .where(and(eq(apiKeys.id, apiKeyId), eq(apiKeys.adminId, user.id)));

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
      adminId: user.id,
      activity: `API_KEY_REVOKED: ${apiKey.name}`,
      timestamp: new Date(),
    });

    return NextResponse.json({
      success: true,
      message: "API key revoked successfully",
    });
  } catch (error) {
    console.error("DELETE /apis/v1/user/api-key error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
