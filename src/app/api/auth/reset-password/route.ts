// src/app/api/auth/reset-password/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";

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
    const resetRecord = await prisma.passwordReset.findUnique({
      where: {
        token,
        isUsed: false,
        expiresAt: { gt: new Date() },
      },
      include: { admin: true },
    });

    if (!resetRecord) {
      return NextResponse.json(
        { error: "Invalid or expired reset token" },
        { status: 400 }
      );
    }

    // Hash new password
    const hashedPassword = await hashPassword(password);

    // Update password and mark token as used
    await Promise.all([
      prisma.admin.update({
        where: { id: resetRecord.adminId },
        data: { password: hashedPassword },
      }),
      prisma.passwordReset.update({
        where: { id: resetRecord.id },
        data: { isUsed: true },
      }),
      // Revoke all existing sessions for security
      prisma.adminSession.updateMany({
        where: { adminId: resetRecord.adminId },
        data: { isActive: false },
      }),
    ]);

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
