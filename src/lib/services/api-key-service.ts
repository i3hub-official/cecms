// src/lib/services/api-key-service.ts
import { db } from "@/lib/server/db/index";
import { apiKeys, apiUsageLogs, admins } from "@/lib/server/db/schema";
import { eq, and, gt, gte, sql } from "drizzle-orm";
import { hashToken, verifyToken } from "@/lib/utils/tokens";
import { logger } from "@/lib/logger";

export interface ApiKeyValidationResult {
  isValid: boolean;
  apiKey?: {
    id: string;
    name: string;
    rateLimit: number;
    usageCount: number;
    prefix: string;
  };
  user?: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
  error?: string;
  rateLimitExceeded?: boolean;
}

/**
 * Validate API key against database
 */
export async function validateApiKey(
  rawApiKey: string,
  clientInfo?: {
    ip?: string;
    userAgent?: string;
    endpoint?: string;
    method?: string;
  }
): Promise<ApiKeyValidationResult> {
  try {
    const prefix = rawApiKey.slice(0, 8);

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
      logger.warn("API key not found", { prefix });
      return {
        isValid: false,
        error: "Invalid API key",
      };
    }

    // Verify the key matches (timing-safe comparison)
    const isValid = await verifyToken(rawApiKey, apiKeyRecord.apiKey.key);

    if (!isValid) {
      logger.warn("API key verification failed", { prefix });
      return {
        isValid: false,
        error: "Invalid API key",
      };
    }

    // Check rate limiting
    const rateLimitResult = await checkRateLimit(
      apiKeyRecord.apiKey.id,
      apiKeyRecord.apiKey.rateLimit
    );

    if (rateLimitResult.exceeded) {
      logger.warn("API key rate limit exceeded", {
        prefix,
        currentUsage: rateLimitResult.currentUsage,
        limit: apiKeyRecord.apiKey.rateLimit,
      });
      return {
        isValid: false,
        error: "Rate limit exceeded",
        rateLimitExceeded: true,
      };
    }

    // Log the API usage (fire and forget)
    if (clientInfo) {
      logApiUsage(
        apiKeyRecord.apiKey.id,
        clientInfo.endpoint || "",
        clientInfo.method || "GET",
        clientInfo.ip || "unknown",
        clientInfo.userAgent || "unknown"
      ).catch((error) => {
        logger.error("Failed to log API usage", { error });
      });
    }

    // Update usage count and last used (fire and forget)
    updateApiKeyUsage(apiKeyRecord.apiKey.id).catch((error) => {
      logger.error("Failed to update API key usage", { error });
    });

    return {
      isValid: true,
      apiKey: {
        id: apiKeyRecord.apiKey.id,
        name: apiKeyRecord.apiKey.name,
        rateLimit: apiKeyRecord.apiKey.rateLimit,
        usageCount: apiKeyRecord.apiKey.usageCount || 0,
        prefix: apiKeyRecord.apiKey.prefix,
      },
      user: apiKeyRecord.admin,
    };
  } catch (error) {
    logger.error("API key validation error", { error: String(error) });
    return {
      isValid: false,
      error: "Internal server error",
    };
  }
}

/**
 * Check rate limiting for API key
 */
async function checkRateLimit(
  apiKeyId: string,
  rateLimit: number
): Promise<{
  exceeded: boolean;
  currentUsage: number;
}> {
  try {
    const currentWindow = new Date();
    currentWindow.setMinutes(0, 0, 0); // Start of current hour

    const [result] = await db
      .select({ count: sql<number>`count(*)` })
      .from(apiUsageLogs)
      .where(
        and(
          eq(apiUsageLogs.apiKeyId, apiKeyId),
          gte(apiUsageLogs.createdAt, currentWindow)
        )
      );

    const currentUsage = result?.count || 0;
    return {
      exceeded: currentUsage >= rateLimit,
      currentUsage,
    };
  } catch (error) {
    logger.error("Rate limit check error", { error: String(error), apiKeyId });
    // On error, allow the request to proceed
    return { exceeded: false, currentUsage: 0 };
  }
}

/**
 * Log API usage
 */
async function logApiUsage(
  apiKeyId: string,
  endpoint: string,
  method: string,
  ipAddress: string,
  userAgent: string
): Promise<void> {
  try {
    await db.insert(apiUsageLogs).values({
      id: crypto.randomUUID(),
      apiKeyId,
      endpoint,
      method,
      statusCode: 200, // Default success, will be updated if needed
      ipAddress,
      userAgent,
      requestTime: 0, // Will be updated with actual response time if needed
      createdAt: new Date(),
    });
  } catch (error) {
    // Don't throw - this is fire and forget
    logger.error("Failed to log API usage", {
      error: String(error),
      apiKeyId,
      endpoint,
    });
  }
}

/**
 * Update API key usage statistics
 */
async function updateApiKeyUsage(apiKeyId: string): Promise<void> {
  try {
    await db
      .update(apiKeys)
      .set({
        usageCount: sql`${apiKeys.usageCount} + 1`,
        lastUsed: new Date(),
        updatedAt: new Date(), // Removed as it is not part of the schema
      })
      .where(eq(apiKeys.id, apiKeyId));
  } catch (error) {
    // Don't throw - this is fire and forget
    logger.error("Failed to update API key usage", {
      error: String(error),
      apiKeyId,
    });
  }
}

/**
 * Update API usage log with response details
 */
export async function updateApiUsageLog(
  apiKeyId: string,
  endpoint: string,
  method: string,
  statusCode: number,
  requestTime: number,
  timeframe: Date = new Date(Date.now() - 60000) // Last minute
): Promise<void> {
  try {
    await db
      .update(apiUsageLogs)
      .set({
        statusCode,
        requestTime,
        createdAt: new Date(),
        
        // Removed updatedAt as it is not part of the schema
      })
      .where(
        and(
          eq(apiUsageLogs.apiKeyId, apiKeyId),
          eq(apiUsageLogs.endpoint, endpoint),
          eq(apiUsageLogs.method, method),
          gte(apiUsageLogs.createdAt, timeframe)
        )
      );
  } catch (error) {
    logger.error("Failed to update API usage log", { error: String(error) });
  }
}

/**
 * Get API key usage statistics
 */
export async function getApiKeyUsage(
  apiKeyId: string,
  timeframe: "hour" | "day" | "week" | "month" = "hour"
): Promise<{
  totalRequests: number;
  successfulRequests: number;
  errorRequests: number;
  averageResponseTime: number;
}> {
  try {
    const timeframeDates = getTimeframeDate(timeframe);

    const [usage] = await db
      .select({
        totalRequests: sql<number>`count(*)`,
        successfulRequests: sql<number>`count(case when ${apiUsageLogs.statusCode} >= 200 and ${apiUsageLogs.statusCode} < 300 then 1 end)`,
        errorRequests: sql<number>`count(case when ${apiUsageLogs.statusCode} >= 400 then 1 end)`,
        averageResponseTime: sql<number>`avg(${apiUsageLogs.requestTime})`,
      })
      .from(apiUsageLogs)
      .where(
        and(
          eq(apiUsageLogs.apiKeyId, apiKeyId),
          gte(apiUsageLogs.createdAt, timeframeDates)
        )
      );

    return {
      totalRequests: usage?.totalRequests || 0,
      successfulRequests: usage?.successfulRequests || 0,
      errorRequests: usage?.errorRequests || 0,
      averageResponseTime: Math.round(usage?.averageResponseTime || 0),
    };
  } catch (error) {
    logger.error("Failed to get API key usage", {
      error: String(error),
      apiKeyId,
    });
    return {
      totalRequests: 0,
      successfulRequests: 0,
      errorRequests: 0,
      averageResponseTime: 0,
    };
  }
}

/**
 * Helper to get date for timeframe
 */
function getTimeframeDate(timeframe: "hour" | "day" | "week" | "month"): Date {
  const now = new Date();

  switch (timeframe) {
    case "hour":
      return new Date(now.getTime() - 60 * 60 * 1000);
    case "day":
      return new Date(now.getTime() - 24 * 60 * 60 * 1000);
    case "week":
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case "month":
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    default:
      return new Date(now.getTime() - 60 * 60 * 1000);
  }
}

/**
 * Clean up old API usage logs
 */
export async function cleanupApiUsageLogs(
  olderThanDays: number = 30
): Promise<number> {
  try {
    const cutoffDate = new Date(
      Date.now() - olderThanDays * 24 * 60 * 60 * 1000
    );

    const result = await db
      .delete(apiUsageLogs)
      .where(sql`${apiUsageLogs.createdAt} < ${cutoffDate}`);

    logger.info("Cleaned up API usage logs", {
      olderThanDays,
      deletedCount: result.length || 0,
    });

    return result.length || 0;
  } catch (error) {
    logger.error("Failed to cleanup API usage logs", { error: String(error) });
    return 0;
  }
}
