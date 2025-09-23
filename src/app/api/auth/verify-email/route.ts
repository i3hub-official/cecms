// src/app/api/auth/verify-email/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/server/db/index";
import {
  emailVerifications,
  admins,
  adminActivities,
} from "@/lib/server/db/schema";
import { eq, and, gt } from "drizzle-orm";
import { logger } from "@/lib/logger";
import crypto from "crypto";

export async function GET(request: NextRequest) {
  const requestId = logger.requestId();
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");
  const userId = searchParams.get("userId");

  if (!token || !userId) {
    return NextResponse.redirect(
      new URL("/auth/signin?error=Verification token and user ID are required", request.url)
    );
  }

  try {
    // Find the verification token for this user
    const [verification] = await db
      .select()
      .from(emailVerifications)
      .where(
        and(
          eq(emailVerifications.token, token),
          eq(emailVerifications.adminId, userId),
          gt(emailVerifications.expires, new Date())
        )
      )
      .limit(1);

    if (!verification) {
      logger.warn("Invalid or expired verification token", {
        requestId,
        token,
        userId,
      });
      return NextResponse.redirect(
        new URL(
          "/auth/signin?error=Invalid or expired verification token",
          request.url
        )
      );
    }

    // Verify the email in transaction
    await db.transaction(async (tx) => {
      // Update admin's email verification status
      await tx
        .update(admins)
        .set({
          isEmailVerified: true,
          updatedAt: new Date(),
        })
        .where(eq(admins.id, verification.adminId));

      // Mark verification token as used
      await tx
        .update(emailVerifications)
        .set({ verifiedAt: new Date() })
        .where(eq(emailVerifications.id, verification.id));

      // Log admin activity
      await tx.insert(adminActivities).values({
        id: crypto.randomUUID(),
        adminId: verification.adminId,
        activity: "EMAIL_VERIFIED",
        timestamp: new Date(),
      });
    });

    logger.info("Email verified successfully", {
      requestId,
      userId: verification.adminId,
      email: verification.email,
    });

    // Get the base URL for proper redirect (avoid localhost)
    const baseUrl = process.env.NODE_ENV === "development" 
      ? process.env.NEXT_PRIVATE_APP_URL || "https://192.168.0.159:3002"
      : process.env.NEXT_PUBLIC_APP_URL || "https://cecms.vercel.app";

    // Use only one redirect URL
    const redirectUrl = baseUrl 
      ? `${baseUrl}/auth/signin?message=Email verified successfully! You can now sign in.`
      : "/auth/signin?message=Email verified successfully! You can now sign in.";

    return NextResponse.redirect(redirectUrl);
  } catch (error) {
    logger.error("Email verification error", { requestId, token, userId }, { error });
    return NextResponse.redirect(
      new URL("/auth/signin?error=Internal server error", request.url)
    );
  }
}