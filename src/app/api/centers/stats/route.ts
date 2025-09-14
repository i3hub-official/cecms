// src/app/api/centers/stats/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateSession } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const authResult = await validateSession(request);
    if (!authResult.isValid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [total, active, inactive, inactiveCenters, recentActivity] =
      await Promise.all([
        prisma.center.count(),
        prisma.center.count({ where: { isActive: true } }),
        prisma.center.count({ where: { isActive: false } }),
        prisma.center.findMany({
          where: { isActive: false },
          take: 10,
          orderBy: { modifiedAt: "desc" },
        }),
        prisma.center.findMany({
          take: 10,
          orderBy: { modifiedAt: "desc" },
        }),
      ]);

    return NextResponse.json({
      total,
      active,
      inactive,
      inactiveCenters,
      recentActivity,
    });
  } catch (error) {
    console.error("Centers stats error:", error);
    return NextResponse.json(
      { error: "Failed to fetch center statistics" },
      { status: 500 }
    );
  }
}
