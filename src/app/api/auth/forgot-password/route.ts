// src/app/api/auth/forgot-password/route.ts

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/server/db/index"; // Update import
import { generateSessionId } from "@/lib/auth";
import { admins, passwordResets } from "@/lib/server/db/schema"; // Import your schema
import { eq } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Check if admin exists
    const [admin] = await db
      .select()
      .from(admins)
      .where(eq(admins.email, email) && eq(admins.isActive, true))
      .limit(1);

    if (!admin) {
      // Don't reveal if email exists or not for security
      return NextResponse.json({
        success: true,
        message:
          "If an account exists with this email, a reset link has been sent",
      });
    }

    // Generate reset token
    const resetToken = generateSessionId();
    const expiresAt = new Date(Date.now() + 1 * 60 * 60 * 1000); // 1 hour

    // Store reset token in database
    await db.insert(passwordResets).values({
      adminId: admin.id,
      token: resetToken,
      expiresAt,
      isUsed: false,
      createdAt: new Date(),
    });

    // In a real application, you would send an email here
    console.log(`Password reset token for ${email}: ${resetToken}`);

    return NextResponse.json({
      success: true,
      message:
        "If an account exists with this email, a reset link has been sent",
      // Remove this in production - only for demo
      resetToken:
        process.env.NODE_ENV === "development" ? resetToken : undefined,
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
