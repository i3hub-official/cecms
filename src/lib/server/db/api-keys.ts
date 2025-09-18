import { db } from "@/lib/server/db/index";
import { apiKeys, apiUsageLogs, apiRateLimits } from "@/lib/server/db/schema";
import { eq, and, gte, lte, sql } from "drizzle-orm";
import { hash, compare } from "bcryptjs";
import crypto from "crypto";

// Generate a new API key (returns plaintext key that should be shown once)
export async function generateApiKey() {
  const plainTextKey = `sk_${crypto.randomBytes(32).toString("hex")}`;
  const hashedKey = await hash(plainTextKey, 12);
  return { plainTextKey, hashedKey };
}

// Verify API key
export async function verifyApiKey(providedKey: string) {
  const [apiKey] = await db
    .select()
    .from(apiKeys)
    .where(eq(apiKeys.isActive, true));

  if (!apiKey) return null;

  const isValid = await compare(providedKey, apiKey.key);
  return isValid ? apiKey : null;
}

// Check if API key has permission for endpoint
export function hasPermission(
  apiKey: typeof apiKeys.$inferSelect,
  endpoint: string,
  method: string
) {
  // Check if key is active and not expired
  if (!apiKey.isActive) return false;
  if (apiKey.expiresAt && apiKey.expiresAt < new Date()) return false;

  // Check endpoint permissions
  const allowedEndpoints = apiKey.allowedEndpoints.split(",");
  const hasEndpointAccess = allowedEndpoints.some((pattern) => {
    if (pattern === "*") return true;
    if (pattern.endsWith("/*")) {
      const base = pattern.slice(0, -2);
      return endpoint.startsWith(base);
    }
    return endpoint === pattern;
  });

  if (!hasEndpointAccess) return false;

  // Check method permissions
  switch (method.toUpperCase()) {
    case "GET":
      return apiKey.canRead;
    case "POST":
    case "PUT":
    case "PATCH":
      return apiKey.canWrite;
    case "DELETE":
      return apiKey.canDelete;
    default:
      return false;
  }
}

// Check rate limiting
export async function checkRateLimit(apiKeyId: string, endpoint: string) {
  const now = new Date();
  const [rateLimit] = await db
    .select()
    .from(apiRateLimits)
    .where(
      and(
        eq(apiRateLimits.apiKeyId, apiKeyId),
        eq(apiRateLimits.endpoint, endpoint),
        gte(apiRateLimits.windowEnd, now)
      )
    );

  if (!rateLimit) {
    // Create new rate limit window
    const windowStart = now;
    const windowEnd = new Date(now.getTime() + 60 * 1000); // 1 minute window

    await db.insert(apiRateLimits).values({
      apiKeyId,
      endpoint,
      requestCount: 1,
      windowStart,
      windowEnd,
    });

    return { allowed: true, remaining: 99 };
  }

  if (rateLimit.requestCount >= 100) {
    // Default rate limit
    return { allowed: false, remaining: 0 };
  }

  // Increment request count
  await db
    .update(apiRateLimits)
    .set({
      requestCount: rateLimit.requestCount + 1,
      updatedAt: now,
    })
    .where(eq(apiRateLimits.id, rateLimit.id));

  return { allowed: true, remaining: 100 - (rateLimit.requestCount + 1) };
}

// Log API usage
export async function logApiUsage(
  apiKeyId: string,
  endpoint: string,
  method: string,
  statusCode: number,
  ipAddress?: string,
  userAgent?: string,
  requestTime?: number,
  requestSize?: number,
  responseSize?: number
) {
  await db.insert(apiUsageLogs).values({
    apiKeyId,
    endpoint,
    method,
    statusCode,
    ipAddress,
    userAgent,
    requestTime,
    requestSize,
    responseSize,
  });

  // Update last used and usage count
  await db
    .update(apiKeys)
    .set({
      lastUsed: new Date(),
      usageCount: sql`${apiKeys.usageCount} + 1`,
      updatedAt: new Date(),
    })
    .where(eq(apiKeys.id, apiKeyId));
}
