// src/app/apis/v1/user/api-key/[id]/regenerate/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/server/db/index";
import { apiKeys, adminActivities } from "@/lib/server/db/schema";
import { eq, and } from "drizzle-orm";
import { getUserFromCookies } from "@/lib/auth";
import { hashToken, generateSecureToken } from "@/lib/utils/tokens";

export async function POST(request: NextRequest, context: any) {
  try {
    const { id } = context.params as { id: string };
    
    // Get user from cookies
    const user = await getUserFromCookies(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify the API key belongs to the user
    const [apiKey] = await db
      .select()
      .from(apiKeys)
      .where(and(eq(apiKeys.id, id), eq(apiKeys.adminId, user.id)));

    if (!apiKey) {
      return NextResponse.json({ error: "API key not found" }, { status: 404 });
    }

    // Generate new token
    const newToken = generateSecureToken(32);
    const prefix = newToken.slice(0, 8);
    const hashedToken = await hashToken(newToken);

    const [updatedKey] = await db
      .update(apiKeys)
      .set({
        key: hashedToken,
        prefix,
        lastUsed: null,
        usageCount: 0,
        updatedAt: new Date(),
      })
      .where(eq(apiKeys.id, id))
      .returning();

    // Log admin activity
    await db.insert(adminActivities).values({
      id: crypto.randomUUID(),
      adminId: user.id,
      activity: `API_KEY_REGENERATED: ${apiKey.name}`,
      timestamp: new Date(),
    });

    return NextResponse.json({
      success: true,
      data: {
        id: updatedKey.id,
        name: updatedKey.name,
        apiKey: newToken,
        prefix: updatedKey.prefix,
      },
      message: "API key regenerated successfully",
    });
  } catch (error) {
    console.error("POST /api/user/api-key/[id]/regenerate error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}