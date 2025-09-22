// File: src/lib/auth.ts
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

export async function validateSession(
  request: NextRequest
): Promise<SessionValidationResult> {
  const requestId = logger.requestId();
  const ip = getClientIp(request) || "unknown";

  try {
    logger.info("Starting full session validation", { requestId, ip });

    // Check Authorization header first
    const authHeader = request.headers.get("authorization");
    let token = authHeader?.startsWith("Bearer ")
      ? authHeader.substring(7)
      : null;

    // If not in header, check cookie
    if (!token) {
      token = request.cookies.get("auth-token")?.value || null;
      logger.info("Token from cookie", { requestId, ip, hasToken: !!token });
    }

    if (!token) {
      logger.warn("No token provided", { requestId, ip });
      return { isValid: false, error: "No token provided" };
    }

    // Verify JWT first
    const jwtResult = await verifyJWT(token);
    if (!jwtResult.isValid || !jwtResult.payload) {
      logger.warn("Invalid JWT token", {
        requestId,
        ip,
        error: jwtResult.error,
      });
      return { isValid: false, error: "Invalid token" };
    }

    // Check session in DB
    logger.info("Checking session in DB", {
      requestId,
      ip,
      sessionId: jwtResult.payload.sessionId,
    });

    const session = await getSessionByToken(token);
    if (!session) {
      logger.warn("Session not found", {
        requestId,
        ip,
        sessionId: jwtResult.payload.sessionId,
      });
      return { isValid: false, error: "Session not found" };
    }

    if (!session.admin.isActive) {
      logger.warn("Admin inactive", {
        requestId,
        ip,
        userId: session.admin.id,
      });
      return { isValid: false, error: "Admin account inactive" };
    }

    await updateSessionLastUsed(session.id);
    logger.info("Session validated", {
      requestId,
      ip,
      userId: session.admin.id,
      sessionId: session.sessionId,
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

export async function validateSessionWithoutUpdate(
  request: NextRequest
): Promise<SessionValidationResult> {
  try {
    const token = getAuthToken(request);
    if (!token) {
      return { isValid: false, error: "No token provided" };
    }

    // Verify JWT without DB check
    const jwtResult = await verifyJWT(token);
    if (!jwtResult.isValid || !jwtResult.payload) {
      return { isValid: false, error: "Invalid token" };
    }

    // If token has more than 1 hour left, skip DB check
    const expirationTime = new Date(jwtResult.payload.exp! * 1000).getTime();
    const timeUntilExpiry = expirationTime - Date.now();

    if (timeUntilExpiry > 60 * 60 * 1000) {
      return {
        isValid: true,
        user: {
          id: jwtResult.payload.userId,
          email: jwtResult.payload.email,
          name: "",
          role: jwtResult.payload.role,
        },
        sessionId: jwtResult.payload.sessionId,
        cached: true,
      };
    }

    // Token close to expiry - do full validation
    return validateSession(request);
  } catch (error) {
    console.error("Lightweight validation error:", error);
    return { isValid: false, error: "Validation error" };
  }
}

export async function createAuthSession(
  adminId: string,
  email: string,
  role: string,
  name: string,
  userAgent?: string,
  ipAddress?: string
) {
  const sessionId = generateSessionId();
  const jwtPayload: JWTClaims = { userId: adminId, email, role, sessionId };
  const token = await createJWT(jwtPayload);

  const session = await createSession(
    adminId,
    token,
    sessionId,
    userAgent,
    ipAddress
  );

  if (!session) throw new Error("Failed to create session");

  return { token, sessionId: session.sessionId };
}

export async function revokeAuthSession(token: string): Promise<boolean> {
  try {
    const jwtResult = await verifyJWT(token);
    if (!jwtResult.isValid || !jwtResult.payload?.sessionId) {
      return false;
    }

    const result = await revokeSession(jwtResult.payload.sessionId);
    return !!result;
  } catch (error) {
    console.error("Error revoking session:", error);
    return false;
  }
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, parseInt(process.env.SALT_ROUNDS || "10", 10));
}

export async function comparePassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function getAuthToken(request: Request): string | null {
  const authHeader = request.headers.get("authorization");
  return extractTokenFromHeader(authHeader);
}
