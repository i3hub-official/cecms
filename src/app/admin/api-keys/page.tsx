import { NextRequest } from "next/server";
import { db } from "@/lib/server/db/index";
import { apiKeys } from "@/lib/server/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { authenticateRequest } from "@/app/apis/shared/middleware/withAuth";
import { successResponse, errorResponse } from "@/app/apis/shared/lib/reponse";
import {
  apiKeyCreateSchema,
  apiKeyRevokeSchema,
} from "@/app/apis/shared/lib/validations/api-key";
import {
  generateApiKey,
  revokeApiKey,
  getApiKeysByAdminId,
} from "@/app/apis/shared/lib/db/api-keys";

// Get all API keys for authenticated admin
export async function GET(request: NextRequest) {
  const authResult = await authenticateRequest(request);

  if (!authResult.success) {
    return errorResponse(
      authResult.error!,
      authResult.status,
      undefined,
      authResult
    );
  }

  // Only allow admins to access their own API keys
  if (!authResult.apiKey?.adminId) {
    return errorResponse(
      "Admin authentication required",
      401,
      undefined,
      authResult
    );
  }

  try {
    const adminApiKeys = await getApiKeysByAdminId(authResult.apiKey.adminId);

    // Don't return the hashed key
    const sanitizedKeys = adminApiKeys.map((key) => ({
      id: key.id,
      prefix: key.prefix,
      name: key.name,
      description: key.description,
      canRead: key.canRead,
      canWrite: key.canWrite,
      canDelete: key.canDelete,
      allowedEndpoints: key.allowedEndpoints,
      rateLimit: key.rateLimit,
      isActive: key.isActive,
      expiresAt: key.expiresAt,
      revokedAt: key.revokedAt,
      createdAt: key.createdAt,
      lastUsed: key.lastUsed,
      usageCount: key.usageCount,
    }));

    return successResponse(sanitizedKeys, undefined, authResult);
  } catch (error) {
    console.error("API keys fetch error:", error);
    return errorResponse(
      "Failed to fetch API keys",
      500,
      undefined,
      authResult
    );
  }
}

// Create new API key
export async function POST(request: NextRequest) {
  const authResult = await authenticateRequest(request);

  if (!authResult.success) {
    return errorResponse(
      authResult.error!,
      authResult.status,
      undefined,
      authResult
    );
  }

  if (!authResult.apiKey?.adminId) {
    return errorResponse(
      "Admin authentication required",
      401,
      undefined,
      authResult
    );
  }

  try {
    const body = await request.json();

    // Validate input
    const validationResult = apiKeyCreateSchema.safeParse(body);
    if (!validationResult.success) {
      return errorResponse(
        `Validation failed: ${validationResult.error.errors[0]?.message}`,
        400,
        undefined,
        authResult
      );
    }

    // Generate new API key with adminId
    const newApiKey = await generateApiKey(
      authResult.apiKey.adminId,
      validationResult.data
    );

    // Return the plaintext key only once
    const response = {
      id: newApiKey.id,
      name: newApiKey.name,
      apiKey: newApiKey.plainTextKey, // Only returned on creation
      prefix: newApiKey.prefix,
      expiresAt: newApiKey.expiresAt,
      createdAt: newApiKey.createdAt,
    };

    return successResponse(response, undefined, authResult);
  } catch (error) {
    console.error("API key creation error:", error);
    return errorResponse(
      "Failed to create API key",
      500,
      undefined,
      authResult
    );
  }
}

// Revoke API key
export async function DELETE(request: NextRequest) {
  const authResult = await authenticateRequest(request);

  if (!authResult.success) {
    return errorResponse(
      authResult.error!,
      authResult.status,
      undefined,
      authResult
    );
  }

  if (!authResult.apiKey?.adminId) {
    return errorResponse(
      "Admin authentication required",
      401,
      undefined,
      authResult
    );
  }

  try {
    const body = await request.json();

    // Validate input
    const validationResult = apiKeyRevokeSchema.safeParse(body);
    if (!validationResult.success) {
      return errorResponse(
        `Validation failed: ${validationResult.error.errors[0]?.message}`,
        400,
        undefined,
        authResult
      );
    }

    // Revoke the API key
    const revokedKey = await revokeApiKey(
      validationResult.data.apiKeyId,
      authResult.apiKey.adminId
    );

    if (!revokedKey) {
      return errorResponse(
        "API key not found or already revoked",
        404,
        undefined,
        authResult
      );
    }

    return successResponse(
      { message: "API key revoked successfully", apiKeyId: revokedKey.id },
      undefined,
      authResult
    );
  } catch (error) {
    console.error("API key revocation error:", error);
    return errorResponse(
      "Failed to revoke API key",
      500,
      undefined,
      authResult
    );
  }
}
