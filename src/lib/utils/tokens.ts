// src/lib/utils/tokens.ts
import { randomBytes, createHash, timingSafeEqual } from "crypto";

/**
 * Hash a token for secure storage using SHA-256
 */
export async function hashToken(token: string): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      const hash = createHash("sha256");
      hash.update(token);
      resolve(hash.digest("hex"));
    } catch (error) {
      reject(error);
    }
  });
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

/**
 * Generate a token with prefix for identification
 */
export function generatePrefixedToken(
  prefix: string = "key",
  length: number = 32
): string {
  const randomPart = randomBytes(length).toString("hex");
  return `${prefix}_${randomPart}`;
}
