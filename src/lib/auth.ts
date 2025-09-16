// lib/auth.ts
import bcrypt from "bcryptjs";
import { randomBytes, createHmac, timingSafeEqual } from "crypto";
import { NextRequest } from "next/server";
import {
  getSessionByToken,
  updateSessionLastUsed,
  createSession,
  revokeSession,
} from "@/lib/session-manager";
import { logger } from "./logger";

const SECRET_KEY = process.env.AUTH_SECRET || "default_secret_key";
const TOKEN_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
  expires: number;
  sessionId?: string;
}

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

// Enhanced token generation with session ID
export function generateToken(
  payload: Omit<TokenPayload, "expires">,
  sessionId?: string
): string {
  const expires = Date.now() + TOKEN_EXPIRY;
  const tokenData: TokenPayload = {
    ...payload,
    expires,
    sessionId: sessionId || randomBytes(16).toString("hex"),
  };

  console.log("[AUTH] Generating token:", {
    userId: payload.userId,
    email: payload.email,
    role: payload.role,
    sessionId: tokenData.sessionId,
    expiresAt: new Date(expires).toISOString(),
  });

  const payloadBase64 = Buffer.from(JSON.stringify(tokenData)).toString(
    "base64url"
  );

  const signature = createHmac("sha256", SECRET_KEY)
    .update(payloadBase64)
    .digest("base64url");

  return `${payloadBase64}.${signature}`;
}

// Custom token verification
export function verifyToken(token: string): TokenPayload | null {
  try {
    console.log("[AUTH] Verifying token...");
    const [payloadBase64, signature] = token.split(".");

    if (!payloadBase64 || !signature) {
      console.warn("[AUTH] Token structure invalid");
      return null;
    }

    const expectedSignature = createHmac("sha256", SECRET_KEY)
      .update(payloadBase64)
      .digest("base64url");

    const signatureBuffer = Buffer.from(signature, "base64url");
    const expectedBuffer = Buffer.from(expectedSignature, "base64url");

    if (
      signatureBuffer.length !== expectedBuffer.length ||
      !timingSafeEqual(signatureBuffer, expectedBuffer)
    ) {
      console.warn("[AUTH] Token signature mismatch");
      return null;
    }

    const payload: TokenPayload = JSON.parse(
      Buffer.from(payloadBase64, "base64url").toString()
    );

    if (Date.now() > payload.expires) {
      console.warn("[AUTH] Token expired");
      return null;
    }

    console.log("[AUTH] Token valid:", {
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
      sessionId: payload.sessionId,
      expiresAt: new Date(payload.expires).toISOString(),
    });

    return payload;
  } catch (err) {
    console.error("[AUTH] Token verification failed:", err);
    return null;
  }
}

// inside validateSession()
export async function validateSession(request: NextRequest) {
  const requestId = logger.requestId();
  const ip = request.headers.get("x-forwarded-for") || "unknown";

  try {
    logger.info("Starting full session validation", { requestId, ip });

    let token = getAuthToken(request);
    if (!token) {
      token = request.cookies.get("auth-token")?.value || null;
      logger.info(
        "Token from cookie",
        { requestId, ip },
        { hasToken: !!token }
      );
    }

    if (!token) {
      logger.warn("No token provided", { requestId, ip });
      return { isValid: false, error: "No token provided" };
    }

    const payload = verifyToken(token);
    if (!payload) {
      logger.warn("Invalid token", { requestId, ip });
      return { isValid: false, error: "Invalid token" };
    }

    logger.info("Checking session in DB", {
      requestId,
      ip,
      sessionId: payload.sessionId,
    });
    const session = await getSessionByToken(token);

    if (!session) {
      logger.warn("Session not found", {
        requestId,
        ip,
        sessionId: payload.sessionId,
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

// Lightweight validation
export async function validateSessionWithoutUpdate(
  request: NextRequest
): Promise<SessionValidationResult> {
  try {
    console.log("[AUTH] Starting lightweight session validation...");
    let token = getAuthToken(request);
    if (!token) {
      token = request.cookies.get("auth-token")?.value || null;
    }

    if (!token) {
      console.warn("[AUTH] No token provided (lightweight)");
      return { isValid: false, error: "No token provided" };
    }

    const payload = verifyToken(token);
    if (!payload) {
      return { isValid: false, error: "Invalid token" };
    }

    const timeUntilExpiry = payload.expires - Date.now();
    console.log("[AUTH] Token time until expiry:", timeUntilExpiry, "ms");

    if (timeUntilExpiry > 60 * 60 * 1000) {
      console.log("[AUTH] Token still valid (>1h left) — skipping DB check");
      return {
        isValid: true,
        user: {
          id: payload.userId,
          email: payload.email,
          name: "",
          role: payload.role,
        },
        sessionId: payload.sessionId,
      };
    }

    console.log("[AUTH] Token close to expiry — doing full validation");
    return validateSession(request);
  } catch (error) {
    console.error("[AUTH] Lightweight validation error:", error);
    return { isValid: false, error: "Validation error" };
  }
}

// Create new session
export async function createAuthSession(
  adminId: string,
  email: string,
  role: string,
  name: string,
  userAgent?: string,
  ipAddress?: string
) {
  const token = generateToken({ userId: adminId, email, role });
  const sessionId = generateSessionId();
  const session = await createSession(adminId, token, sessionId, userAgent, ipAddress);

  console.log("[AUTH] Created new auth session:", {
    adminId,
    email,
    role,
    sessionId: session?.sessionId,
  });

  if (!session) throw new Error("Failed to create session");

  return { token, sessionId: session.sessionId };
}

// Revoke session
export async function revokeAuthSession(token: string): Promise<boolean> {
  try {
    console.log("[AUTH] Revoking session...");
    const payload = verifyToken(token);
    if (!payload || !payload.sessionId) {
      console.warn("[AUTH] Cannot revoke — invalid token or no sessionId");
      return false;
    }

    const result = await revokeSession(payload.sessionId);
    console.log("[AUTH] Session revoked:", {
      sessionId: payload.sessionId,
      success: !!result,
    });

    return !!result;
  } catch (error) {
    console.error("[AUTH] Error revoking session:", error);
    return false;
  }
}

export function generateSessionId(): string {
  const id = randomBytes(32).toString("hex");
  console.log("[AUTH] Generated session ID");
  return id;
}

export async function hashPassword(password: string): Promise<string> {
  console.log("[AUTH] Hashing password...");
  return bcrypt.hash(password, parseInt(process.env.SALT_ROUNDS || "10", 10));
}

export async function comparePassword(
  password: string,
  hash: string
): Promise<boolean> {
  console.log("[AUTH] Comparing password with stored hash...");
  return bcrypt.compare(password, hash);
}

export function getAuthToken(request: Request): string | null {
  const authHeader = request.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  return authHeader.substring(7);
}

export function getSessionIdFromToken(token: string): string | null {
  try {
    const [payloadBase64] = token.split(".");
    if (!payloadBase64) return null;

    const payload: TokenPayload = JSON.parse(
      Buffer.from(payloadBase64, "base64url").toString()
    );

    return payload.sessionId || null;
  } catch {
    return null;
  }
}
