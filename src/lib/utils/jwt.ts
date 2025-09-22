// File: src/lib/utils/jwt.ts
import { SignJWT, jwtVerify, type JWTPayload } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "fallback-secret-change-in-production"
);
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "2h";

export interface JWTClaims {
  userId: string;
  email: string;
  role: string;
  sessionId: string;
}

export interface JWTVerificationResult {
  isValid: boolean;
  payload?: JWTPayload & JWTClaims;
  error?: string;
}

export async function createJWT(payload: JWTClaims): Promise<string> {
  return await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(JWT_EXPIRES_IN)
    .sign(JWT_SECRET);
}

export async function verifyJWT(token: string): Promise<JWTVerificationResult> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return { isValid: true, payload: payload as JWTPayload & JWTClaims };
  } catch (error) {
    return {
      isValid: false,
      error: error instanceof Error ? error.message : "Invalid token",
    };
  }
}

export function extractTokenFromHeader(
  authHeader: string | null
): string | null {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  return authHeader.slice(7); // Remove "Bearer " prefix
}
