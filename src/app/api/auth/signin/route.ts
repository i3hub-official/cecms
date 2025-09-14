// src/app/api/auth/signin/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { comparePassword, generateToken, generateSessionId } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: "Email and password are required" },
        { status: 400 }
      );
    }

    // ✅ Use findFirst (not findUnique) to filter by email + isActive
    const admin = await prisma.admin.findFirst({
      where: { email, isActive: true },
    });

    if (!admin) {
      return NextResponse.json(
        { success: false, error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Verify password
    const isPasswordValid = await comparePassword(password, admin.password);
    if (!isPasswordValid) {
      return NextResponse.json(
        { success: false, error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Generate token and session
    const token = generateToken({
      userId: admin.id,
      email: admin.email,
      role: admin.role,
    });

    const sessionId = generateSessionId();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Store session in DB
    await prisma.adminSession.create({
      data: {
        adminId: admin.id,
        sessionId,
        token,
        expiresAt,
        isActive: true,
      },
    });

    // Return user info
    const response = NextResponse.json({
      success: true,
      message: "Signed in successfully",
      user: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.role,
      },
    });

    // ✅ Set secure HttpOnly cookie
    response.cookies.set("auth-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 24 * 60 * 60, // 24 hours
      path: "/",
    });

    // Set cache control headers
    response.headers.set("Cache-Control", "no-store, max-age=0");

    return response;
  } catch (error) {
    console.error("Signin error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}