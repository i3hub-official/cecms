
// src/app/api/keys/[id]/regenerate/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/server/db";
import { apiKeys } from "@/lib/server/db/schema";
import { validateSession } from "@/lib/auth";
import { eq, and } from "drizzle-orm";
import * as crypto from "crypto";
import * as bcrypt from "bcryptjs";

// POST - Regenerate API key
export async function POST(
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
          eq(apiKeys.adminId, authResult.user.id),
          eq(apiKeys.isActive, true)
        )
      )
      .limit(1);

    if (apiKey.length === 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: "API key not found",
          details: "The specified API key does not exist, is inactive, or you don't have permission to access it"
        },
        { status: 404 }
      );
    }

    // Generate new API key
    const rawKey = `ak_${crypto.randomBytes(32).toString('hex')}`;
    const hashedKey = await bcrypt.hash(rawKey, 12);
    const prefix = rawKey.substring(0, 8);

    // Update the API key with new values
    const updatedKey = await db
      .update(apiKeys)
      .set({
        key: hashedKey,
        prefix,
        updatedAt: new Date(),
        usageCount: 0, // Reset usage count
        lastUsed: null, // Reset last used
      })
      .where(eq(apiKeys.id, keyId))
      .returning();

    return NextResponse.json({
      success: true,
      data: {
        id: updatedKey[0].id,
        key: rawKey, // Only return the raw key once upon regeneration
        prefix: updatedKey[0].prefix,
        name: updatedKey[0].name,
      },
      message: "API key regenerated successfully. Make sure to copy it now as you won't be able to see it again.",
    });
  } catch (error) {
    console.error("API Key regenerate error:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to regenerate API key",
        details: process.env.NODE_ENV === "development" && error instanceof Error
          ? error.message
          : undefined,
      },
      { status: 500 }
    );
  }
}