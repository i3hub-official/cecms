// src/lib/auth.ts
import { NextRequest } from "next/server";
import {
  createJWT,
  verifyJWT,
  extractTokenFromHeader,
  type JWTClaims,
  type JWTVerificationResult,
} from "@/lib/utils/jwt";
import { generateSessionId } from "@/lib/session-manager";
import {
  getSessionByToken,
  updateSessionLastUsed,
  createSession,
  revokeSession,
} from "@/lib/session-manager";
import { logger } from "./logger";
import bcrypt from "bcryptjs";
import { getClientIp } from "./utils/client-ip";

export interface SessionValidationResult {
  isValid: boolean;
  user?: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
  sessionId?: string;
  error?: string;
  cached?: boolean;
}

export interface AuthSession {
  token: string;
  sessionId: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
}

/**
 * Full session validation with database check
 */
export async function validateSession(
  request: NextRequest
): Promise<SessionValidationResult> {
  const requestId = logger.requestId();
  const ip = getClientIp(request) || "unknown";

  try {
    logger.info("Starting full session validation", {
      requestId,
      ip,
      path: request.nextUrl.pathname,
    });

    // Extract token from header or cookie
    const token = extractAuthToken(request);

    if (!token) {
      logger.warn("No authentication token provided", { requestId, ip });
      return { isValid: false, error: "No token provided" };
    }

    // Verify JWT first (quick validation)
    const jwtResult = await verifyJWT(token);
    if (!jwtResult.isValid || !jwtResult.payload) {
      logger.warn("Invalid JWT token", {
        requestId,
        ip,
        error: jwtResult.error,
      });
      return { isValid: false, error: "Invalid token" };
    }

    // Check session in DB for active validation
    logger.debug("Checking session in database", {
      requestId,
      ip,
      sessionId: jwtResult.payload.sessionId,
      userId: jwtResult.payload.userId,
    });

    const session = await getSessionByToken(token);
    if (!session) {
      logger.warn("Session not found or inactive", {
        requestId,
        ip,
        sessionId: jwtResult.payload.sessionId,
      });
      return { isValid: false, error: "Session not found" };
    }

    if (!session.admin.isActive) {
      logger.warn("Admin account inactive", {
        requestId,
        ip,
        userId: session.admin.id,
      });
      return { isValid: false, error: "Admin account inactive" };
    }

    // Update last used timestamp (with possible expiry extension)
    await updateSessionLastUsed(session.sessionId);

    logger.info("Session validation successful", {
      requestId,
      ip,
      userId: session.admin.id,
      sessionId: session.sessionId,
      email: session.admin.email,
    });

    return {
      isValid: true,
      user: {
        id: session.admin.id,
        email: session.admin.email,
        name: session.admin.name,
        role: session.admin.role,
      },
      sessionId: session.sessionId,
    };
  } catch (error) {
    logger.error("Session validation error", { requestId, ip }, { error });
    return { isValid: false, error: "Internal server error" };
  }
}

/**
 * Lightweight validation for frequent checks (uses JWT only, no DB hit)
 */
export async function validateSessionLightweight(
  request: NextRequest
): Promise<SessionValidationResult> {
  const requestId = logger.requestId();
  const ip = getClientIp(request) || "unknown";

  try {
    logger.debug("Lightweight session validation", { requestId, ip });

    const token = extractAuthToken(request);
    if (!token) {
      return { isValid: false, error: "No token provided" };
    }

    // Verify JWT without DB check
    const jwtResult = await verifyJWT(token);
    if (!jwtResult.isValid || !jwtResult.payload) {
      return { isValid: false, error: "Invalid token" };
    }

    // If token has more than 1 hour left, consider it valid without DB check
    const expirationTime = new Date(jwtResult.payload.exp! * 1000).getTime();
    const timeUntilExpiry = expirationTime - Date.now();
    const oneHour = 60 * 60 * 1000;

    if (timeUntilExpiry > oneHour) {
      logger.debug("Lightweight validation successful (cached)", {
        requestId,
        ip,
        userId: jwtResult.payload.userId,
        expiresIn: `${Math.round(timeUntilExpiry / 1000 / 60)} minutes`,
      });

      return {
        isValid: true,
        user: {
          id: jwtResult.payload.userId,
          email: jwtResult.payload.email,
          name: jwtResult.payload.name || "",
          role: jwtResult.payload.role,
        },
        sessionId: jwtResult.payload.sessionId,
        cached: true,
      };
    }

    // Token close to expiry - do full validation
    logger.debug("Token near expiry, performing full validation", {
      requestId,
      ip,
      expiresIn: `${Math.round(timeUntilExpiry / 1000 / 60)} minutes`,
    });

    return await validateSession(request);
  } catch (error) {
    logger.error("Lightweight validation error", { requestId, ip }, { error });
    return { isValid: false, error: "Validation error" };
  }
}

/**
 * Create a new authentication session
 */
export async function createAuthSession(
  adminId: string,
  email: string,
  role: string,
  name: string,
  userAgent?: string,
  ipAddress?: string
): Promise<AuthSession> {
  const requestId = logger.requestId();

  try {
    logger.info("Creating new auth session", { requestId, adminId, email });

    const sessionId = generateSessionId();
    const jwtPayload: JWTClaims = {
      userId: adminId,
      email,
      role,
      sessionId,
      name,
    };

    const token = await createJWT(jwtPayload);

    const session = await createSession(
      adminId,
      token,
      sessionId,
      userAgent,
      ipAddress
    );

    if (!session) {
      throw new Error("Failed to create session in database");
    }

    logger.info("Auth session created successfully", {
      requestId,
      adminId,
      sessionId,
    });

    return {
      token,
      sessionId: session.sessionId,
      user: { id: adminId, email, name, role },
    };
  } catch (error) {
    logger.error("Error creating auth session", { requestId, adminId, error: String(error) });
    throw new Error("Failed to create authentication session");
  }
}

/**
 * Revoke (logout) an authentication session
 */
export async function revokeAuthSession(token: string): Promise<boolean> {
  const requestId = logger.requestId();

  try {
    logger.info("Revoking auth session", { requestId });

    const jwtResult = await verifyJWT(token);
    if (!jwtResult.isValid || !jwtResult.payload?.sessionId) {
      logger.warn("Invalid token during session revocation", { requestId });
      return false;
    }

    const result = await revokeSession(jwtResult.payload.sessionId);

    if (result) {
      logger.info("Auth session revoked successfully", {
        requestId,
        sessionId: jwtResult.payload.sessionId,
        userId: jwtResult.payload.userId,
      });
    } else {
      logger.warn("Session not found during revocation", {
        requestId,
        sessionId: jwtResult.payload.sessionId,
      });
    }

    return !!result;
  } catch (error) {
    logger.error("Error revoking auth session", { requestId, error: String(error) });
    return false;
  }
}

/**
 * Extract authentication token from request (header or cookie)
 */
export function extractAuthToken(
  request: NextRequest | Request
): string | null {
  // Handle Authorization header
  const authHeader = request.headers.get("authorization");
  let token = extractTokenFromHeader(authHeader);

  // Fallback to cookie if no header token
  if (!token && request instanceof NextRequest) {
    token = request.cookies.get("auth-token")?.value || null;
  }

  return token;
}

/**
 * Password utilities
 */
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = parseInt(process.env.SALT_ROUNDS || "12", 10);
  return bcrypt.hash(password, saltRounds);
}

export async function comparePassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Get current user from request (convenience function)
 */
export async function getCurrentUser(request: NextRequest) {
  const session = await validateSession(request);
  return session.isValid ? session.user : null;
}

/**
 * Check if user has required role
 */
export async function hasRequiredRole(
  request: NextRequest,
  requiredRole: string | string[]
): Promise<boolean> {
  const session = await validateSessionLightweight(request);

  if (!session.isValid || !session.user) {
    return false;
  }

  const requiredRoles = Array.isArray(requiredRole)
    ? requiredRole
    : [requiredRole];
  return requiredRoles.includes(session.user.role);
}
