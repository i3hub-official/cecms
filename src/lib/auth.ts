// lib/auth.ts
import bcrypt from "bcryptjs";
import { randomBytes, createHmac, timingSafeEqual } from "crypto";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

const SECRET_KEY = process.env.AUTH_SECRET || "default_secret_key";
const TOKEN_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
  expires: number;
}

export interface SessionValidationResult {
  isValid: boolean;
  user?: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
  error?: string;
}

// Custom token generation
export function generateToken(payload: Omit<TokenPayload, "expires">): string {
  const expires = Date.now() + TOKEN_EXPIRY;
  const tokenData: TokenPayload = {
    ...payload,
    expires,
  };

  // Create base64 encoded payload
  const payloadBase64 = Buffer.from(JSON.stringify(tokenData)).toString(
    "base64url"
  );

  // Create HMAC signature
  const signature = createHmac("sha256", SECRET_KEY)
    .update(payloadBase64)
    .digest("base64url");

  // Return token as payload.signature
  return `${payloadBase64}.${signature}`;
}

// Custom token verification
export function verifyToken(token: string): TokenPayload | null {
  try {
    const [payloadBase64, signature] = token.split(".");

    if (!payloadBase64 || !signature) {
      return null;
    }

    // Verify signature
    const expectedSignature = createHmac("sha256", SECRET_KEY)
      .update(payloadBase64)
      .digest("base64url");

    // Use timing-safe comparison to prevent timing attacks
    const signatureBuffer = Buffer.from(signature, "base64url");
    const expectedBuffer = Buffer.from(expectedSignature, "base64url");

    if (
      signatureBuffer.length !== expectedBuffer.length ||
      !timingSafeEqual(signatureBuffer, expectedBuffer)
    ) {
      return null;
    }

    // Decode payload
    const payload: TokenPayload = JSON.parse(
      Buffer.from(payloadBase64, "base64url").toString()
    );

    // Check expiration
    if (Date.now() > payload.expires) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

// Validate session from request (works with both cookies and headers)
export async function validateSession(
  request: NextRequest
): Promise<SessionValidationResult> {
  try {
    // Try to get token from Authorization header first
    let token = getAuthToken(request);

    // If not found in header, try cookie
    if (!token) {
      token = request.cookies.get("auth-token")?.value || null;
    }

    if (!token) {
      return { isValid: false, error: "No token provided" };
    }

    // Verify token
    const payload = verifyToken(token);
    if (!payload) {
      return { isValid: false, error: "Invalid token" };
    }

    // Check if session exists in database and is active
    const session = await prisma.adminSession.findFirst({
      where: {
        token,
        isActive: true,
        expiresAt: { gt: new Date() },
      },
      include: {
        admin: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            isActive: true,
          },
        },
      },
    });

    if (!session) {
      return { isValid: false, error: "Session not found" };
    }

    if (!session.admin.isActive) {
      return { isValid: false, error: "Admin account is inactive" };
    }

    // Update last used timestamp
    await prisma.adminSession.update({
      where: { id: session.id },
      data: { lastUsed: new Date() },
    });

    return {
      isValid: true,
      user: {
        id: session.admin.id,
        email: session.admin.email,
        name: session.admin.name,
        role: session.admin.role,
      },
    };
  } catch (error) {
    console.error("Session validation error:", error);
    return { isValid: false, error: "Internal server error" };
  }
}

// Generate secure session token for additional security
export function generateSessionId(): string {
  return randomBytes(32).toString("hex");
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function comparePassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function getAuthToken(request: Request): string | null {
  const authHeader = request.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  return authHeader.substring(7);
}
