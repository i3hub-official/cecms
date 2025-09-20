// src/app/apis/v1/user/api-key/[id]/regenerate/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/server/db/index";
import { apiKeys, adminActivities } from "@/lib/server/db/schema";
import { eq, and } from "drizzle-orm";
import { validateSession } from "@/lib/auth";
import { hashToken, generateSecureToken } from "@/lib/utils/tokens";

// Use Next.js Params type instead of custom interface
interface Params {
  params: {
    id: string;
  };
}

export async function POST(request: NextRequest, { params }: Params) {
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
        and(eq(apiKeys.id, apiKeyId), eq(apiKeys.adminId, session.user.id))
      );

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
      .where(eq(apiKeys.id, apiKeyId))
      .returning();

    // Log admin activity
    await db.insert(adminActivities).values({
      id: crypto.randomUUID(),
      adminId: session.user.id,
      activity: `API_KEY_REGENERATED: ${apiKey.name}`,
      timestamp: new Date(),
    });

    return NextResponse.json({
      success: true,
      data: {
        id: updatedKey.id,
        name: updatedKey.name,
        apiKey: newToken, // The new token
        prefix: updatedKey.prefix,
      },
      message: "API key regenerated successfully",
    });
  } catch (error) {
    console.error("POST /apis/v1/user/api-key/[id]/regenerate error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
