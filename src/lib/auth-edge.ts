// src/lib/auth-edge.ts - Edge Runtime compatible
import { NextRequest } from "next/server";
import { verifyJWT, extractTokenFromHeader } from "@/lib/utils/jwt";

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
}

/**
 * JWT-only validation (no database calls) for Edge Runtime
 */
export async function validateSessionEdge(
  request: NextRequest
): Promise<SessionValidationResult> {
  try {
    // Extract token from header or cookie
    const authHeader = request.headers.get("authorization");
    const token =
      extractTokenFromHeader(authHeader) ||
      request.cookies.get("auth-token")?.value;

    if (!token) {
      return { isValid: false, error: "No token provided" };
    }

    // Verify JWT without DB check (Edge compatible)
    const jwtResult = await verifyJWT(token);

    if (!jwtResult.isValid || !jwtResult.payload) {
      return { isValid: false, error: jwtResult.error || "Invalid token" };
    }

    // Note: This doesn't check the database session
    // For full validation, you'll need to handle this in API routes
    return {
      isValid: true,
      user: {
        id: jwtResult.payload.userId,
        email: jwtResult.payload.email,
        role: jwtResult.payload.role,
        name: jwtResult.payload.name || "",
      },
      sessionId: jwtResult.payload.sessionId,
    };
  } catch (error) {
    return { isValid: false, error: "Authentication failed" };
  }
}
