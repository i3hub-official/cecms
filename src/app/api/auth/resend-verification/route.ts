// src/app/api/auth/resend-verification/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/server/db/index";
import {
  emailVerifications,
  admins,
  adminActivities,
} from "@/lib/server/db/schema";
import { eq, and, gt } from "drizzle-orm";
import { logger } from "@/lib/logger";
import { EmailService } from "@/lib/services/email";
import crypto from "crypto";

const emailService = EmailService.getInstance();

export async function POST(request: NextRequest) {
  const requestId = logger.requestId();
  const { email } = await request.json();

  if (!email) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  try {
    // Find admin by email
    const [admin] = await db
      .select()
      .from(admins)
      .where(eq(admins.email, email.toLowerCase()))
      .limit(1);

    if (!admin) {
      return NextResponse.json(
        { error: "No account found with this email" },
        { status: 404 }
      );
    }

    // Check if email is already verified
    if (admin.isEmailVerified) {
      logger.info("Resend verification attempted for already verified email", {
        requestId,
        email,
        userId: admin.id,
      });

      return NextResponse.json(
        {
          error: "Your email address is already verified. You can sign in now.",
          alreadyVerified: true,
        },
        { status: 400 }
      );
    }

    // Check for recent verification attempts (optional rate limiting)
    const recentAttempts = await db
      .select()
      .from(emailVerifications)
      .where(
        and(
          eq(emailVerifications.adminId, admin.id),
          gt(emailVerifications.createdAt, new Date(Date.now() - 5 * 60 * 1000)) // Last 5 minutes
        )
      )
      .limit(1);

    if (recentAttempts.length > 0) {
      return NextResponse.json(
        {
          error:
            "Please wait a few minutes before requesting another verification email.",
          retryAfter: true,
        },
        { status: 429 }
      );
    }

    // Generate new verification token
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const tokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    // Create new verification record
    await db.insert(emailVerifications).values({
      id: crypto.randomUUID(),
      adminId: admin.id,
      email: admin.email,
      token: verificationToken,
      expires: tokenExpires,
      createdAt: new Date(),
    });

    // Send verification email - pass userId as the fourth parameter
    const emailSent = await emailService.sendVerificationEmail(
      admin.email,
      verificationToken,
      admin.name,
      admin.id // Add userId parameter
    );

    if (!emailSent) {
      throw new Error("Failed to send verification email");
    }

    // Log the activity
    await db.insert(adminActivities).values({
      id: crypto.randomUUID(),
      adminId: admin.id,
      activity: "VERIFICATION_EMAIL_RESENT",
      timestamp: new Date(),
    });

    logger.info("Verification email resent successfully", {
      requestId,
      userId: admin.id,
      email: admin.email,
    });

    return NextResponse.json({
      success: true,
      message: "Verification email sent successfully. Please check your inbox.",
    });
  } catch (error) {
    logger.error("Resend verification error", { requestId, email }, { error });
    return NextResponse.json(
      { error: "Internal server error. Please try again later." },
      { status: 500 }
    );
  }
}
