
// src/app/api/auth/resend-verification/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/server/db/index";
import { emailVerifications, admins, adminActivities } from "@/lib/server/db/schema";
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

    if (admin.isEmailVerified) {
      return NextResponse.json(
        { error: "Email is already verified" },
        { status: 400 }
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

    // Send verification email
    const emailSent = await emailService.sendVerificationEmail(
      admin.email,
      verificationToken,
      admin.id
    );

    if (!emailSent) {
      throw new Error("Failed to send verification email");
    }

    return NextResponse.json({
      success: true,
      message: "Verification email sent successfully",
    });
  } catch (error) {
    logger.error("Resend verification error", { requestId, email }, { error });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
