// src/app/api/auth/reset-password/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/server/db/index";
import { hashPassword } from "@/lib/auth";
import { admins, passwordResets, adminSessions } from "@/lib/server/db/schema";
import { eq, and, gt } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    const { token, password } = await request.json();

    if (!token || !password) {
      return NextResponse.json(
        { error: "Token and password are required" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters long" },
        { status: 400 }
      );
    }

    // Find valid reset token
    const [resetRecord] = await db
      .select({
        id: passwordResets.id,
        adminId: passwordResets.adminId,
        admin: admins,
      })
      .from(passwordResets)
      .innerJoin(admins, eq(passwordResets.adminId, admins.id))
      .where(
        and(
          eq(passwordResets.token, token),
          eq(passwordResets.isUsed, false),
          gt(passwordResets.expiresAt, new Date())
        )
      )
      .limit(1);

    if (!resetRecord) {
      return NextResponse.json(
        { error: "Invalid or expired reset token" },
        { status: 400 }
      );
    }

    // Hash new password
    const hashedPassword = await hashPassword(password);

    // Update password and mark token as used in a transaction
    await db.transaction(async (tx) => {
      // Update admin password
      await tx
        .update(admins)
        .set({ password: hashedPassword })
        .where(eq(admins.id, resetRecord.adminId));

      // Mark token as used
      await tx
        .update(passwordResets)
        .set({ isUsed: true })
        .where(eq(passwordResets.id, resetRecord.id));

      // Revoke all existing sessions for security
      await tx
        .update(adminSessions)
        .set({ isActive: false })
        .where(eq(adminSessions.adminId, resetRecord.adminId));
    });

    return NextResponse.json({
      success: true,
      message: "Password reset successfully",
    });
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
