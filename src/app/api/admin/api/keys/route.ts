// src/app/api/keys/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/server/db";
import { apiKeys, admins, apiUsageLogs } from "@/lib/server/db/schema";
import { validateSession } from "@/lib/auth";
import { eq, and, desc } from "drizzle-orm";
import * as crypto from "crypto";
import * as bcrypt from "bcryptjs";

// GET - List all API keys for the authenticated admin
export async function GET(request: NextRequest) {
  try {
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

    // Get API keys for the current admin
    const userApiKeys = await db
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
          eq(apiKeys.adminId, authResult.user.id),
          eq(apiKeys.isActive, true)
        )
      )
      .orderBy(desc(apiKeys.createdAt));

    return NextResponse.json({
      success: true,
      data: userApiKeys,
    });
  } catch (error) {
    console.error("API Keys GET error:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to fetch API keys",
        details: process.env.NODE_ENV === "development" && error instanceof Error
          ? error.message
          : undefined,
      },
      { status: 500 }
    );
  }
}

// POST - Create a new API key
export async function POST(request: NextRequest) {
  try {
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

    const body = await request.json();
    const {
      name,
      description,
      canRead = true,
      canWrite = false,
      canDelete = false,
      canManageKeys = false,
      allowedEndpoints = "*",
      rateLimit = 100,
      rateLimitPeriod = 60,
      expiresAt,
    } = body;

    // Validate required fields
    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: "API key name is required" },
        { status: 400 }
      );
    }

    if (name.length > 100) {
      return NextResponse.json(
        { success: false, error: "API key name must be less than 100 characters" },
        { status: 400 }
      );
    }

    // Check if user already has an API key with this name
    const existingKey = await db
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

    if (existingKey.length > 0) {
      return NextResponse.json(
        { success: false, error: "An API key with this name already exists" },
        { status: 409 }
      );
    }

    // Generate API key
    const rawKey = `ak_${crypto.randomBytes(32).toString('hex')}`;
    const hashedKey = await bcrypt.hash(rawKey, 12);
    const prefix = rawKey.substring(0, 8);

    // Validate expiration date if provided
    let expirationDate: Date | null = null;
    if (expiresAt) {
      expirationDate = new Date(expiresAt);
      if (expirationDate <= new Date()) {
        return NextResponse.json(
          { success: false, error: "Expiration date must be in the future" },
          { status: 400 }
        );
      }
    }

    // Create API key
    const newApiKey = await db
      .insert(apiKeys)
      .values({
        key: hashedKey,
        prefix,
        name: name.trim(),
        description: description?.trim() || null,
        adminId: authResult.user.id,
        canRead,
        canWrite,
        canDelete,
        canManageKeys,
        allowedEndpoints,
        rateLimit: Math.max(1, Math.min(10000, rateLimit)), // Clamp between 1 and 10000
        rateLimitPeriod: Math.max(1, Math.min(3600, rateLimitPeriod)), // Clamp between 1 and 3600
        expiresAt: expirationDate,
      })
      .returning();

    return NextResponse.json({
      success: true,
      data: {
        id: newApiKey[0].id,
        key: rawKey, // Only return the raw key once upon creation
        prefix: newApiKey[0].prefix,
        name: newApiKey[0].name,
        description: newApiKey[0].description,
        permissions: {
          canRead: newApiKey[0].canRead,
          canWrite: newApiKey[0].canWrite,
          canDelete: newApiKey[0].canDelete,
          canManageKeys: newApiKey[0].canManageKeys,
        },
        allowedEndpoints: newApiKey[0].allowedEndpoints,
        rateLimit: newApiKey[0].rateLimit,
        rateLimitPeriod: newApiKey[0].rateLimitPeriod,
        expiresAt: newApiKey[0].expiresAt,
        createdAt: newApiKey[0].createdAt,
      },
      message: "API key created successfully. Make sure to copy it now as you won't be able to see it again.",
    });
  } catch (error) {
    console.error("API Keys POST error:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to create API key",
        details: process.env.NODE_ENV === "development" && error instanceof Error
          ? error.message
          : undefined,
      },
      { status: 500 }
    );
  }
}
