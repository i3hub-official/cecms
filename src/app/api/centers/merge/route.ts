// app/api/centers/merge/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Center } from "@prisma/client"; // Import the Prisma model type

export async function POST(request: NextRequest) {
  try {
    const {
      primaryId,
      secondaryIds,
    }: { primaryId: string; secondaryIds: string[] } = await request.json();

    if (!primaryId || !secondaryIds || !Array.isArray(secondaryIds)) {
      return NextResponse.json(
        { message: "Invalid merge request" },
        { status: 400 }
      );
    }

    // Get all centers
    const allCenterIds = [primaryId, ...secondaryIds];
    const centers: Center[] = await prisma.center.findMany({
      where: { id: { in: allCenterIds } },
    });

    if (centers.length !== allCenterIds.length) {
      return NextResponse.json(
        { message: "Some centers not found" },
        { status: 404 }
      );
    }

    // TypeScript-safe find/filter
    const primaryCenter = centers.find((c: Center) => c.id === primaryId);
    const secondaryCenters = centers.filter((c: Center) =>
      secondaryIds.includes(c.id)
    );

    if (!primaryCenter) {
      return NextResponse.json(
        { message: "Primary center not found" },
        { status: 404 }
      );
    }

    // Transaction for merge
    const result = await prisma.$transaction(async (tx) => {
      // Get most recently modified secondary center
      const mostRecentSecondary = secondaryCenters.sort(
        (a, b) => b.modifiedAt.getTime() - a.modifiedAt.getTime()
      )[0];

      const updatedPrimary = await tx.center.update({
        where: { id: primaryId },
        data: {
          // Keep primary data unless secondary is more recent
          name:
            mostRecentSecondary.modifiedAt > primaryCenter.modifiedAt
              ? mostRecentSecondary.name
              : primaryCenter.name,
          address:
            mostRecentSecondary.modifiedAt > primaryCenter.modifiedAt
              ? mostRecentSecondary.address
              : primaryCenter.address,
          modifiedBy: "system_merge",
        },
      });

      // Delete secondary centers
      await tx.center.deleteMany({ where: { id: { in: secondaryIds } } });

      return updatedPrimary;
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error merging centers:", error);
    return NextResponse.json(
      { message: "Failed to merge centers", error },
      { status: 500 }
    );
  }
}
