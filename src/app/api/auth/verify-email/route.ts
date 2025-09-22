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
  const email = searchParams.get("email");

  if (!token) {
    // Redirect to login page with error
    return NextResponse.redirect(
      new URL("/auth/signin?error=Verification token is required", request.url)
    );
  }

  try {
    // Find the verification token
    const [verification] = await db
      .select()
      .from(emailVerifications)
      .where(
        and(
          eq(emailVerifications.token, token),
          gt(emailVerifications.expires, new Date())
        )
      )
      .limit(1);

    if (!verification) {
      logger.warn("Invalid or expired verification token", {
        requestId,
        token,
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

    // Redirect to login page with success message
    return NextResponse.redirect(
      new URL(
        "/auth/signin?message=Email verified successfully! You can now sign in.",
        request.url
      )
    );
  } catch (error) {
    logger.error("Email verification error", { requestId, token }, { error });
    return NextResponse.redirect(
      new URL("/auth/signin?error=Internal server error", request.url)
    );
  }
}
