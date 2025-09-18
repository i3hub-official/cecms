// src/app/api/auth/signup/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/server/db/index";
import { hashPassword } from "@/lib/auth";
import { admins } from "@/lib/server/db/schema";
import { eq } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    const { name, phone, email, password } = await request.json();

    const nameTrimmed = (name as string)?.trim();
    const phoneTrimmed = (phone as string)?.trim();
    const emailTrimmed = (email as string)?.trim();
    const passwordTrimmed = (password as string)?.trim();

    // Validate input

    if (!nameTrimmed || !emailTrimmed || !passwordTrimmed) {
      return NextResponse.json(
        { error: "Name, phone, email, and password are required" },
        { status: 400 }
      );
    }

    if (!/^[a-zA-Z\s-]+$/.test(nameTrimmed)) {
      return NextResponse.json(
        { error: "Name can only contain alphabets, spaces, and hyphens" },
        { status: 400 }
      );
    }

    if (nameTrimmed.length > 50) {
      return NextResponse.json(
        { error: "Name cannot exceed 50 characters" },
        { status: 400 }
      );
    }

    if (phoneTrimmed && !/^\d+$/.test(phoneTrimmed)) {
      return NextResponse.json(
        { error: "Phone number must contain only digits" },
        { status: 400 }
      );
    }

    if (phoneTrimmed && phoneTrimmed.length !== 11) {
      return NextResponse.json(
        { error: "Invalid phone number provided" },
        { status: 400 }
      );
    }

    if (!/\S+@\S+\.\S+/.test(emailTrimmed)) {
      return NextResponse.json(
        { error: "Invalid email provided" },
        { status: 400 }
      );
    }

    if (passwordTrimmed.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters long" },
        { status: 400 }
      );
    }

    const response = await fetch(
      `https://apinigeria.vercel.app/api/checkemail?email=${encodeURIComponent(
        emailTrimmed
      )}`
    );
    const data = await response.json();
    if (!response.ok || !data.isValid) {
      return NextResponse.json(
        { error: "This email address cannot be used for account creation." },
        { status: 400 }
      );
    }
    // Check if admin already exists
    const [existingAdmin] = await db
      .select()
      .from(admins)
      .where(eq(admins.email, emailTrimmed))
      .limit(1);

    if (existingAdmin) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await hashPassword(passwordTrimmed);

    // Create admin
    const [admin] = await db
      .insert(admins)
      .values({
        name: nameTrimmed,
        email: emailTrimmed,
        password: hashedPassword,
        role: "ADMIN",
        isActive: true,
        createdAt: new Date(),
      })
      .returning();

    return NextResponse.json(
      {
        success: true,
        message: "Account created successfully",
        user: {
          id: admin.id,
          email: admin.email,
          name: admin.name,
          role: admin.role,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
