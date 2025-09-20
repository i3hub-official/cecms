// src/lib/middleware/api-auth.ts
import { NextRequest } from "next/server";
import { db } from "@/lib/server/db/index";
import { apiKeys, apiUsageLogs, admins } from "@/lib/server/db/schema";
import { eq, and, gt, gte, sql } from "drizzle-orm";
import { hashToken, verifyToken } from "@/lib/utils/tokens";

export async function authenticateApiRequest(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return { 
      success: false, 
      error: "Missing or invalid Authorization header",
      status: 401
    };
  }

  const apiKey = authHeader.substring(7);
  const clientIp = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";
  const userAgent = request.headers.get("user-agent") || "unknown";

  try {
    // Hash the provided API key for comparison
    const hashedKey = await hashToken(apiKey);
    const prefix = apiKey.slice(0, 8);

    // Find the API key in database
    const [apiKeyRecord] = await db
      .select({
        apiKey: apiKeys,
        admin: {
          id: admins.id,
          email: admins.email,
          name: admins.name,
          role: admins.role,
        },
      })
      .from(apiKeys)
      .innerJoin(admins, eq(apiKeys.adminId, admins.id))
      .where(
        and(
          eq(apiKeys.prefix, prefix),
          eq(apiKeys.isActive, true),
          eq(admins.isActive, true),
          gt(apiKeys.expiresAt, new Date())
        )
      )
      .limit(1);

    if (!apiKeyRecord) {
      return { 
        success: false, 
        error: "Invalid API key",
        status: 401
      };
    }

    // Verify the key matches (timing-safe comparison)
    const isValid = await verifyToken(apiKey, apiKeyRecord.apiKey.key);

    if (!isValid) {
      return { 
        success: false, 
        error: "Invalid API key",
        status: 401
      };
    }

    // Check rate limiting
    const currentWindow = new Date();
    currentWindow.setMinutes(0, 0, 0); // Start of current hour

    const requestCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(apiUsageLogs)
      .where(
        and(
          eq(apiUsageLogs.apiKeyId, apiKeyRecord.apiKey.id),
          gte(apiUsageLogs.createdAt, currentWindow)
        )
      );

    if (requestCount[0]?.count >= apiKeyRecord.apiKey.rateLimit) {
      return { 
        success: false, 
        error: "Rate limit exceeded",
        status: 429
      };
    }

    // Log the API usage
    await db.insert(apiUsageLogs).values({
      id: crypto.randomUUID(),
      apiKeyId: apiKeyRecord.apiKey.id,
      endpoint: request.nextUrl.pathname,
      method: request.method,
      statusCode: 200, // Will be updated by the actual endpoint
      ipAddress: clientIp,
      userAgent,
      requestTime: 0, // Will be updated with actual response time
      createdAt: new Date(),
    });

    // Update usage count
    await db
      .update(apiKeys)
      .set({
        usageCount: (apiKeyRecord.apiKey.usageCount || 0) + 1,
        lastUsed: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(apiKeys.id, apiKeyRecord.apiKey.id));

    return {
      success: true,
      apiKey: apiKeyRecord.apiKey,
      user: apiKeyRecord.admin,
    };
  } catch (error) {
    console.error("API authentication error:", error);
    return { 
      success: false, 
      error: "Internal server error",
      status: 500
    };
  }
}