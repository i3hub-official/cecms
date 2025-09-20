// src/lib/utils/password-reset.ts
import { SignJWT, jwtVerify } from "jose";
import { hashToken } from "@/lib/utils/tokens";
import { randomBytes, timingSafeEqual } from "crypto";


const PASSWORD_RESET_SECRET = new TextEncoder().encode(
  process.env.PASSWORD_RESET_SECRET ||
    "fallback-reset-secret-change-in-production"
);
const PASSWORD_RESET_EXPIRES_IN = process.env.PASSWORD_RESET_EXPIRES_IN || "1h";

export interface PasswordResetClaims {
  userId: string;
  email: string;
  purpose: "password_reset";
}

export async function createPasswordResetToken(
  userId: string,
  email: string
): Promise<string> {
  return await new SignJWT({ userId, email, purpose: "password_reset" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(PASSWORD_RESET_EXPIRES_IN)
    .sign(PASSWORD_RESET_SECRET);
}

export async function verifyPasswordResetToken(token: string): Promise<{
  isValid: boolean;
  payload?: PasswordResetClaims;
  error?: string;
}> {
  try {
    const { payload } = await jwtVerify(token, PASSWORD_RESET_SECRET);

    if (
      (payload as unknown as PasswordResetClaims).purpose !== "password_reset"
    ) {
      return { isValid: false, error: "Invalid token purpose" };
    }

    return {
      isValid: true,
      payload: payload as unknown as PasswordResetClaims,
    };
  } catch (error) {
    return {
      isValid: false,
      error: error instanceof Error ? error.message : "Invalid reset token",
    };
  }
}

/**
 * Verify a token against its hash (timing-safe comparison)
 */
export async function verifyToken(
  token: string,
  hash: string
): Promise<boolean> {
  try {
    const tokenHash = await hashToken(token);

    // Use timingSafeEqual to prevent timing attacks
    const tokenBuffer = Buffer.from(tokenHash, "utf8");
    const hashBuffer = Buffer.from(hash, "utf8");

    return (
      tokenBuffer.length === hashBuffer.length &&
      timingSafeEqual(tokenBuffer, hashBuffer)
    );
  } catch (error) {
    console.error("Token verification error:", error);
    return false;
  }
}

/**
 * Generate a secure random token
 */
export function generateSecureToken(length: number = 32): string {
  return randomBytes(length).toString("hex");
}
