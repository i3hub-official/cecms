// src/lib/middleware/api-auth.ts
import { NextRequest } from "next/server";
import { db } from "@/lib/server/db/index";
import { apiKeys, apiUsageLogs, admins } from "@/lib/server/db/schema";
import { eq, and, gt, gte, sql } from "drizzle-orm";
import { hashToken, verifyToken } from "@/lib/utils/tokens";
import { logger } from "@/lib/logger";

export interface ApiAuthResult {
  success: boolean;
  error?: string;
  status?: number;
  apiKey?: typeof apiKeys.$inferSelect;
  user?: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
}

export async function authenticateApiRequest(
  request: NextRequest
): Promise<ApiAuthResult> {
  const authHeader = request.headers.get("authorization");
  const requestId = logger.requestId();
  const clientIp =
    request.headers.get("x-forwarded-for") ||
    request.headers.get("x-real-ip") ||
    "unknown";

  logger.info("API authentication attempt", {
    requestId,
    clientIp,
    path: request.nextUrl.pathname,
  });

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    logger.warn("Missing or invalid Authorization header", {
      requestId,
      clientIp,
    });
    return {
      success: false,
      error: "Missing or invalid Authorization header. Use 'Bearer <API_KEY>'",
      status: 401,
    };
  }

  const apiKey = authHeader.substring(7);
  const userAgent = request.headers.get("user-agent") || "unknown";

  // Validate API key format
  if (!apiKey || apiKey.length < 32) {
    logger.warn("Invalid API key format", {
      requestId,
      clientIp,
      keyLength: apiKey.length,
    });
    return {
      success: false,
      error: "Invalid API key format",
      status: 401,
    };
  }

  try {
    // Extract prefix for efficient lookup
    const prefix = apiKey.slice(0, 8);

    logger.debug("Looking up API key", { requestId, prefix });

    // Find the API key in database with admin details
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
      logger.warn("API key not found or inactive", {
        requestId,
        clientIp,
        prefix,
      });
      return {
        success: false,
        error: "Invalid API key",
        status: 401,
      };
    }

    // Verify the key matches (timing-safe comparison)
    const isValid = await verifyToken(apiKey, apiKeyRecord.apiKey.key);

    if (!isValid) {
      logger.warn("API key verification failed", {
        requestId,
        clientIp,
        apiKeyId: apiKeyRecord.apiKey.id,
      });
      return {
        success: false,
        error: "Invalid API key",
        status: 401,
      };
    }

    // Check rate limiting (hourly window)
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

    const hourlyRequests = requestCount[0]?.count || 0;

    if (hourlyRequests >= apiKeyRecord.apiKey.rateLimit) {
      logger.warn("Rate limit exceeded", {
        requestId,
        clientIp,
        apiKeyId: apiKeyRecord.apiKey.id,
        hourlyRequests,
        rateLimit: apiKeyRecord.apiKey.rateLimit,
      });
      return {
        success: false,
        error: "Rate limit exceeded",
        status: 429,
      };
    }

    // Log the API usage
    const usageLogId = crypto.randomUUID();
    await db.insert(apiUsageLogs).values({
      id: usageLogId,
      apiKeyId: apiKeyRecord.apiKey.id,
      endpoint: request.nextUrl.pathname,
      method: request.method,
      ipAddress: clientIp,
      userAgent,
      createdAt: new Date(),
      statusCode: 200, // Add the required statusCode property
    });

    // Update usage count and last used timestamp
    await db
      .update(apiKeys)
      .set({
        usageCount: (apiKeyRecord.apiKey.usageCount || 0) + 1,
        lastUsed: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(apiKeys.id, apiKeyRecord.apiKey.id));

    logger.info("API authentication successful", {
      requestId,
      clientIp,
      apiKeyId: apiKeyRecord.apiKey.id,
      adminId: apiKeyRecord.admin.id,
      hourlyRequests: hourlyRequests + 1,
    });

    return {
      success: true,
      apiKey: apiKeyRecord.apiKey,
      user: apiKeyRecord.admin,
    };
  } catch (error) {
    logger.error(
      "API authentication error",
      { requestId, clientIp },
      { error }
    );
    return {
      success: false,
      error: "Internal server error",
      status: 500,
    };
  }
}

// Helper function to create new API keys
export async function createApiKey(
  adminId: string,
  name: string,
  rateLimit: number = 1000,
  expiresInDays: number = 365
): Promise<{ apiKey: string; prefix: string; id: string }> {
  try {
    const { generateSecureToken, generatePrefixedToken } = await import(
      "@/lib/utils/tokens"
    );

    // Generate a secure API key
    const apiKey = generatePrefixedToken("sk", 32); // sk = secret key
    const prefix = apiKey.slice(0, 8);
    const hashedKey = await hashToken(apiKey);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);

    const [newApiKey] = await db
      .insert(apiKeys)
      .values({
        id: crypto.randomUUID(),
        adminId,
        name,
        prefix,
        key: hashedKey,
        rateLimit,
        expiresAt,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    logger.info("API key created", { adminId, apiKeyId: newApiKey.id, name });

    return {
      apiKey, // Return the plaintext key only once
      prefix: newApiKey.prefix,
      id: newApiKey.id,
    };
  } catch (error) {
    logger.error("Error creating API key", { adminId, error: String(error) });
    throw new Error("Failed to create API key");
  }
}

// Helper function to revoke API keys
export async function revokeApiKey(
  apiKeyId: string,
  adminId: string
): Promise<boolean> {
  try {
    const [updated] = await db
      .update(apiKeys)
      .set({
        isActive: false,
        updatedAt: new Date(),
      })
      .where(and(eq(apiKeys.id, apiKeyId), eq(apiKeys.adminId, adminId)))
      .returning();

    if (updated) {
      logger.info("API key revoked", { apiKeyId, adminId });
      return true;
    }

    return false;
  } catch (error) {
    logger.error("Error revoking API key", {
      apiKeyId,
      adminId,
      error: String(error),
    });
    return false;
  }
}
