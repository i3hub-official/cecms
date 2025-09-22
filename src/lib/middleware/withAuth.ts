// File: src/lib/middleware/withAuth.ts
import { NextRequest } from "next/server";
import { verifyJWT, extractTokenFromHeader } from "@/lib/utils/jwt";

export async function authenticateRequest(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
      return {
        success: false,
        error: "Authorization header required",
        status: 401,
      };
    }

    const verification = await verifyJWT(token);

    if (!verification.isValid) {
      return {
        success: false,
        error: verification.error || "Invalid or expired token",
        status: 401,
      };
    }

    return {
      success: true,
      payload: verification.payload,
      token,
    };
  } catch (error) {
    console.error("Authentication error:", error);
    return {
      success: false,
      error: "Authentication failed",
      status: 500,
    };
  }
}
