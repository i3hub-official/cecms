// src/app/api/admin/audit-logs/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/server/db";
import { auditLogs, admins } from "@/lib/server/db/schema";
import { getUserFromCookies } from "@/lib/auth";
import { eq, desc } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    // Get user from cookies
    const user = await getUserFromCookies(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check permissions for audit log access
    if (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        {
          success: false,
          error: "Insufficient permissions to view audit logs",
        },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);
    const offset = (page - 1) * limit;

    // Get audit logs with admin info
    const logs = await db
      .select({
        id: auditLogs.id,
        action: auditLogs.action,
        entity: auditLogs.entity,
        entityId: auditLogs.entityId,
        details: auditLogs.details,
        timestamp: auditLogs.timestamp,
        adminName: admins.name,
        adminEmail: admins.email,
      })
      .from(auditLogs)
      .leftJoin(admins, eq(auditLogs.adminId, admins.id))
      .orderBy(desc(auditLogs.timestamp))
      .limit(limit)
      .offset(offset);

    return NextResponse.json({
      success: true,
      data: logs,
      pagination: {
        page,
        limit,
        hasMore: logs.length === limit,
      },
    });
  } catch (error) {
    console.error("Audit logs GET error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch audit logs",
        details:
          process.env.NODE_ENV === "development" && error instanceof Error
            ? error.message
            : undefined,
      },
      { status: 500 }
    );
  }
}
