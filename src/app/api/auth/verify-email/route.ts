
// Create email verification endpoint: src/app/api/auth/verify-email/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/server/db/index";
import { emailVerifications, admins, adminActivities } from "@/lib/server/db/schema";
import { eq, and, gt } from "drizzle-orm";
import { logger } from "@/lib/logger";

export async function GET(request: NextRequest) {
  const requestId = logger.requestId();
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');

  if (!token) {
    return NextResponse.json(
      { error: "Verification token is required" },
      { status: 400 }
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
      logger.warn("Invalid or expired verification token", { requestId, token });
      return NextResponse.json(
        { error: "Invalid or expired verification token" },
        { status: 400 }
      );
    }

    // Verify the email in transaction
    await db.transaction(async (tx) => {
      // Update admin's email verification status
      await tx
        .update(admins)
        .set({ 
          isEmailVerified: true,
          updatedAt: new Date()
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

    // Redirect to success page or return success response
    return NextResponse.json({
      success: true,
      message: "Email verified successfully. You can now log in to your account.",
    });

  } catch (error) {
    logger.error("Email verification error", { requestId, token }, { error });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}