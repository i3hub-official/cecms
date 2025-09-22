// src/app/api/auth/signup/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/server/db/index";
import { hashPassword } from "@/lib/auth";
import { admins, adminActivities, emailVerifications } from "@/lib/server/db/schema";
import { eq, or, and, gt } from "drizzle-orm";
import { logger } from "@/lib/logger";
import { getClientIp } from "@/lib/utils/client-ip";
import { rateLimitByIp } from "@/lib/middleware/rateLimit";
import { EmailService } from "@/lib/services/email";
import crypto from "crypto";

// Initialize email service
const emailService = EmailService.getInstance();

export async function POST(request: NextRequest) {
  const requestId = logger.requestId();
  const ip = getClientIp(request) || "unknown";

  try {
    logger.info("Signup attempt", { requestId, ip });

    // Rate limiting - 5 signups per hour per IP
    const rateLimitResult = await rateLimitByIp(request, {
      interval: 60 * 60 * 1000, // 1 hour
      limit: 5,
    });

    if (!rateLimitResult.success) {
      logger.warn("Rate limit exceeded for signup", { requestId, ip });
      return NextResponse.json(
        { error: "Too many signup attempts. Please try again later." },
        { status: 429, headers: { "Retry-After": "3600" } }
      );
    }

    const { name, phone, email, password } = await request.json();

    const nameTrimmed = (name as string)?.trim();
    const phoneTrimmed = (phone as string)?.trim();
    const emailTrimmed = (email as string)?.trim().toLowerCase();
    const passwordTrimmed = (password as string)?.trim();

    // Validate input
    if (!nameTrimmed || !emailTrimmed || !passwordTrimmed) {
      logger.warn("Missing required fields", { requestId, ip });
      return NextResponse.json(
        { error: "Name, email, and password are required" },
        { status: 400 }
      );
    }

    // Name validation
    if (!/^[a-zA-Z\s-]+$/.test(nameTrimmed)) {
      logger.warn("Invalid name format", { requestId, ip, name: nameTrimmed });
      return NextResponse.json(
        { error: "Name can only contain alphabets, spaces, and hyphens" },
        { status: 400 }
      );
    }

    if (nameTrimmed.length > 50) {
      logger.warn("Name too long", {
        requestId,
        ip,
        nameLength: nameTrimmed.length,
      });
      return NextResponse.json(
        { error: "Name cannot exceed 50 characters" },
        { status: 400 }
      );
    }

    // Phone validation (optional field)
    if (phoneTrimmed && !/^\d+$/.test(phoneTrimmed)) {
      logger.warn("Invalid phone format", {
        requestId,
        ip,
        phone: phoneTrimmed,
      });
      return NextResponse.json(
        { error: "Phone number must contain only digits" },
        { status: 400 }
      );
    }

    if (phoneTrimmed && phoneTrimmed.length !== 11) {
      logger.warn("Invalid phone length", {
        requestId,
        ip,
        phoneLength: phoneTrimmed.length,
      });
      return NextResponse.json(
        { error: "Phone number must be 11 digits" },
        { status: 400 }
      );
    }

    // Email validation
    if (!/\S+@\S+\.\S+/.test(emailTrimmed)) {
      logger.warn("Invalid email format", {
        requestId,
        ip,
        email: emailTrimmed,
      });
      return NextResponse.json(
        { error: "Invalid email provided" },
        { status: 400 }
      );
    }

    // Password validation
    if (passwordTrimmed.length < 8) {
      logger.warn("Password too short", {
        requestId,
        ip,
        passwordLength: passwordTrimmed.length,
      });
      return NextResponse.json(
        { error: "Password must be at least 8 characters long" },
        { status: 400 }
      );
    }

    // Check for strong password
    const passwordStrength = validatePasswordStrength(passwordTrimmed);
    if (!passwordStrength.valid) {
      logger.warn("Weak password", { requestId, ip });
      return NextResponse.json(
        { error: passwordStrength.message },
        { status: 400 }
      );
    }

    // External email validation (optional - you can remove this if not needed)
    try {
      // Create AbortController for better timeout handling
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(
        `https://apinigeria.vercel.app/api/checkemail?email=${encodeURIComponent(
          emailTrimmed
        )}`,
        {
          signal: controller.signal,
          headers: {
            "User-Agent": "YourApp/1.0",
          },
        }
      );

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = (await response.json()) as {
          isDisposable?: boolean;
          isValid?: boolean;
        };

        // Check multiple possible response formats
        const isDisposable = data.isDisposable || data.isValid === false;

        if (isDisposable) {
          logger.warn("Disposable email address detected", {
            requestId,
            ip,
            email: emailTrimmed,
          });
          return NextResponse.json(
            {
              error:
                "This email address is disposable and cannot be used for account creation.",
            },
            { status: 400 }
          );
        }
      } else {
        logger.warn("Email validation service returned error", {
          requestId,
          ip,
          status: response.status,
          statusText: response.statusText,
        });
      }
    } catch (error) {
      // Handle different types of errors
      if (error instanceof Error) {
        if (error.name === "AbortError") {
          logger.warn("Email validation request timed out", {
            requestId,
            ip,
            email: emailTrimmed,
          });
        } else {
          logger.warn("Email validation service unavailable", {
            requestId,
            ip,
            error: error.message,
            stack: error.stack,
          });
        }
      } else {
        logger.warn("Email validation service unavailable", {
          requestId,
          ip,
          error: String(error),
        });
      }
      // Continue with signup process if validation fails
    }

    // Check if admin already exists
    const [existingAdmin] = await db
      .select()
      .from(admins)
      .where(or(eq(admins.email, emailTrimmed), eq(admins.phone, phoneTrimmed)))
      .limit(1);

    if (existingAdmin) {
      logger.warn("Email or phone number already exists", {
        requestId,
        ip,
        email: emailTrimmed,
      });
      return NextResponse.json(
        { error: "An account with this email or phone number already exists" },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await hashPassword(passwordTrimmed);

    // Generate email verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const tokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Create admin in transaction
    const [admin] = await db.transaction(async (tx) => {
      const [newAdmin] = await tx
        .insert(admins)
        .values({
          id: crypto.randomUUID(),
          name: nameTrimmed,
          phone: phoneTrimmed,
          email: emailTrimmed,
          password: hashedPassword,
          role: "ADMIN",
          isActive: true,
          isEmailVerified: false, // Start as unverified
          createdAt: new Date(),
          lastLogin: new Date(),
        })
        .returning();

      // Create email verification record
      await tx.insert(emailVerifications).values({
        id: crypto.randomUUID(),
        adminId: newAdmin.id,
        email: newAdmin.email,
        token: verificationToken,
        expires: tokenExpires,
        createdAt: new Date(),
      });

      // Log admin activity
      await tx.insert(adminActivities).values({
        id: crypto.randomUUID(),
        adminId: newAdmin.id,
        activity: "ACCOUNT_CREATED",
        timestamp: new Date(),
      });

      return [newAdmin];
    });

    // Send verification email
    try {
      const emailSent = await emailService.sendVerificationEmail(
        admin.email,
        verificationToken,
        admin.id
      );

      if (!emailSent) {
        logger.error("Failed to send verification email", {
          requestId,
          ip,
          userId: admin.id,
          email: admin.email,
        });
        // Don't fail the signup if email fails, just log it
      } else {
        logger.info("Verification email sent successfully", {
          requestId,
          ip,
          userId: admin.id,
          email: admin.email,
        });
      }
    } catch (emailError) {
      logger.error("Error sending verification email", {
        requestId,
        ip,
        userId: admin.id,
        email: admin.email,
        error: emailError instanceof Error ? emailError.message : String(emailError),
      });
      // Continue with signup even if email fails
    }

    logger.info("Account created successfully", {
      requestId,
      ip,
      userId: admin.id,
      email: admin.email,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Account created successfully. Please check your email to verify your account.",
        user: {
          id: admin.id,
          email: admin.email,
          name: admin.name,
          role: admin.role,
          isEmailVerified: false,
        },
        requiresVerification: true,
      },
      { status: 201 }
    );
  } catch (error) {
    logger.error("Signup error", { requestId, ip }, { error });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * Validate password strength
 */
function validatePasswordStrength(password: string): {
  valid: boolean;
  message?: string;
} {
  if (password.length < 8) {
    return {
      valid: false,
      message: "Password must be at least 8 characters long",
    };
  }

  if (!/[A-Z]/.test(password)) {
    return {
      valid: false,
      message: "Password must contain at least one uppercase letter",
    };
  }

  if (!/[a-z]/.test(password)) {
    return {
      valid: false,
      message: "Password must contain at least one lowercase letter",
    };
  }

  if (!/\d/.test(password)) {
    return {
      valid: false,
      message: "Password must contain at least one number",
    };
  }

  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    return {
      valid: false,
      message: "Password must contain at least one special character",
    };
  }

  // Check for common passwords
  const commonPasswords = [
    "password",
    "123456",
    "qwerty",
    "admin",
    "welcome",
    "password123",
  ];
  if (commonPasswords.includes(password.toLowerCase())) {
    return { valid: false, message: "Password is too common and insecure" };
  }

  return { valid: true };
}