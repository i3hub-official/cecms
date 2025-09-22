// src/app/api/admin/settings/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getUserFromCookies } from "@/lib/auth";

// Default system settings (could be replaced by a DB table later)
const DEFAULT_SETTINGS = {
  sessionTimeout: 24,
  maxSessions: 5,
  apiRateLimit: 1000,
  enableNotifications: true,
  enableAuditLog: true,
};

// GET - Get system settings
export async function GET(request: NextRequest) {
  try {
    const authUser = await getUserFromCookies(request);
    if (!authUser) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check admin privileges
    if (authUser.role !== "ADMIN" && authUser.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { success: false, error: "Insufficient permissions to view system settings" },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      data: DEFAULT_SETTINGS,
    });
  } catch (error) {
    console.error("Settings GET error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch settings",
        details:
          process.env.NODE_ENV === "development" && error instanceof Error
            ? error.message
            : undefined,
      },
      { status: 500 }
    );
  }
}

// PUT - Update system settings
export async function PUT(request: NextRequest) {
  try {
    const authUser = await getUserFromCookies(request);
    if (!authUser) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (authUser.role !== "ADMIN" && authUser.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { success: false, error: "Insufficient permissions to modify system settings" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      sessionTimeout,
      maxSessions,
      apiRateLimit,
      enableNotifications,
      enableAuditLog,
    } = body;

    // Validate settings
    const validationErrors: string[] = [];

    if (sessionTimeout !== undefined) {
      if (!Number.isInteger(sessionTimeout) || sessionTimeout < 1 || sessionTimeout > 168) {
        validationErrors.push("Session timeout must be between 1 and 168 hours");
      }
    }

    if (maxSessions !== undefined) {
      if (!Number.isInteger(maxSessions) || maxSessions < 1 || maxSessions > 50) {
        validationErrors.push("Max sessions must be between 1 and 50");
      }
    }

    if (apiRateLimit !== undefined) {
      if (!Number.isInteger(apiRateLimit) || apiRateLimit < 10 || apiRateLimit > 50000) {
        validationErrors.push("API rate limit must be between 10 and 50,000 requests per minute");
      }
    }

    if (validationErrors.length > 0) {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: validationErrors },
        { status: 400 }
      );
    }

    // Build updated settings
    const updatedSettings = { ...DEFAULT_SETTINGS };
    if (sessionTimeout !== undefined) updatedSettings.sessionTimeout = sessionTimeout;
    if (maxSessions !== undefined) updatedSettings.maxSessions = maxSessions;
    if (apiRateLimit !== undefined) updatedSettings.apiRateLimit = apiRateLimit;
    if (enableNotifications !== undefined) updatedSettings.enableNotifications = enableNotifications;
    if (enableAuditLog !== undefined) updatedSettings.enableAuditLog = enableAuditLog;

    return NextResponse.json({
      success: true,
      data: updatedSettings,
      message: "System settings updated successfully",
    });
  } catch (error) {
    console.error("Settings PUT error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update settings",
        details:
          process.env.NODE_ENV === "development" && error instanceof Error
            ? error.message
            : undefined,
      },
      { status: 500 }
    );
  }
}
