// src/app/apis/get-token/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createJWT } from "@/lib/utils/jwt";
import { verifyApiKey } from "@/app/apis/shared/lib/db/api-keys";
import { db } from "@/lib/server/db/index";
import { admins } from "@/lib/server/db/schema";
import { eq } from "drizzle-orm";
import crypto from "crypto";

export async function POST(request: NextRequest) {
  try {
    const apiKey = request.headers.get("x-api-key");

    if (!apiKey) {
      return NextResponse.json(
        { error: "X-API-Key header required" },
        { status: 401 }
      );
    }

    // Verify the API key
    const verifiedKey = await verifyApiKey(apiKey);

    if (!verifiedKey) {
      return NextResponse.json({ error: "Invalid API key" }, { status: 401 });
    }

    // Check if API key has permission to generate tokens
    if (!verifiedKey.canRead) {
      return NextResponse.json(
        { error: "API key doesn't have permission to generate tokens" },
        { status: 403 }
      );
    }

    // Get admin details for the token
    const [admin] = await db
      .select()
      .from(admins)
      .where(eq(admins.id, verifiedKey.adminId))
      .limit(1);

    if (!admin) {
      return NextResponse.json(
        { error: "Admin account not found" },
        { status: 404 }
      );
    }

    // Create JWT token with appropriate claims
    const token = await createJWT({
      userId: admin.id,
      email: admin.email,
      role: "system", // Or use admin.role if you have roles defined
      sessionId: crypto.randomUUID(), // Generate a unique session ID for this token
    });

    return NextResponse.json({
      accessToken: token,
      tokenType: "Bearer",
      expiresIn: process.env.JWT_EXPIRES_IN || "2h",
      scope: verifiedKey.allowedEndpoints,
      userId: admin.id,
      email: admin.email,
    });
  } catch (err) {
    console.error("Token generation error:", err);
    return NextResponse.json(
      { error: "Failed to generate token" },
      { status: 500 }
    );
  }
}
