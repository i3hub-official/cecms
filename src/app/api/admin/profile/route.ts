// src/app/api/admin/profile/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/server/db";
import { admins } from "@/lib/server/db/schema";
import { getUserFromCookies } from "@/lib/auth";
import { eq } from "drizzle-orm";

// GET - Get current admin profile
export async function GET(request: NextRequest) {
  try {
    const authUser = await getUserFromCookies(request);
    if (!authUser) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const user = await db
      .select({
        id: admins.id,
        name: admins.name,
        email: admins.email,
        phone: admins.phone,
        role: admins.role,
        isActive: admins.isActive,
        createdAt: admins.createdAt,
        lastLogin: admins.lastLogin,
      })
      .from(admins)
      .where(eq(admins.id, authUser.id))
      .limit(1);

    if (user.length === 0) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: user[0],
    });
  } catch (error) {
    console.error("Profile GET error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch profile",
        details:
          process.env.NODE_ENV === "development" && error instanceof Error
            ? error.message
            : undefined,
      },
      { status: 500 }
    );
  }
}

// PUT - Update admin profile
export async function PUT(request: NextRequest) {
  try {
    const authUser = await getUserFromCookies(request);
    if (!authUser) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { phone } = body;

    if (phone !== undefined) {
      if (!phone.trim()) {
        return NextResponse.json(
          { success: false, error: "Phone number cannot be empty" },
          { status: 400 }
        );
      }

      const phoneRegex = /^[+]?[\d\s\-\(\)]{10,}$/;
      if (!phoneRegex.test(phone.trim())) {
        return NextResponse.json(
          { success: false, error: "Please enter a valid phone number" },
          { status: 400 }
        );
      }

      const existingPhone = await db
        .select()
        .from(admins)
        .where(eq(admins.phone, phone.trim()))
        .limit(1);

      if (existingPhone.length > 0 && existingPhone[0].id !== authUser.id) {
        return NextResponse.json(
          { success: false, error: "This phone number is already in use" },
          { status: 409 }
        );
      }
    }

    const updateData: Partial<{ phone: string }> = {};
    if (phone !== undefined) updateData.phone = phone.trim();

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { success: false, error: "No valid fields provided for update" },
        { status: 400 }
      );
    }

    const updatedUser = await db
      .update(admins)
      .set(updateData)
      .where(eq(admins.id, authUser.id))
      .returning({
        id: admins.id,
        name: admins.name,
        email: admins.email,
        phone: admins.phone,
        role: admins.role,
      });

    return NextResponse.json({
      success: true,
      data: updatedUser[0],
      message: "Profile updated successfully",
    });
  } catch (error) {
    console.error("Profile PUT error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update profile",
        details:
          process.env.NODE_ENV === "development" && error instanceof Error
            ? error.message
            : undefined,
      },
      { status: 500 }
    );
  }
}
