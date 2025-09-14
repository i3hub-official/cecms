import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthToken } from "@/lib/auth"; // helper that extracts cookie header safely

export async function GET(request: NextRequest) {
  try {
    const token =
      getAuthToken(request) || request.cookies.get("auth-token")?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, error: "No token found" },
        { status: 401 }
      );
    }

    // Find active session
    const session = await prisma.adminSession.findFirst({
      where: {
        token,
        isActive: true,
        expiresAt: { gt: new Date() }, // not expired
      },
      include: {
        admin: true, // eager load admin details
      },
    });

    if (!session || !session.admin) {
      return NextResponse.json(
        { success: false, error: "Invalid or expired session" },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        id: session.admin.id,
        email: session.admin.email,
        name: session.admin.name,
        role: session.admin.role,
      },
    });
  } catch (error) {
    console.error("Validate error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
