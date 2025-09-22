import { NextRequest, NextResponse } from "next/server";
import { passwordService } from "@/lib/services/password";
import { getUserFromCookies } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromCookies(request);

    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { currentPassword, newPassword } = await request.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: "Current password and new password are required" },
        { status: 400 }
      );
    }

    const result = await passwordService.changePassword(
      user.id,
      currentPassword,
      newPassword
    );

    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    console.error("Change password error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
