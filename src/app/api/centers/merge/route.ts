import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/server/db/index";
import { centers } from "@/lib/server/db/schema";
import { eq, inArray } from "drizzle-orm";

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
    const centersData = await db
      .select()
      .from(centers)
      .where(inArray(centers.id, allCenterIds));

    if (centersData.length !== allCenterIds.length) {
      return NextResponse.json(
        { message: "Some centers not found" },
        { status: 404 }
      );
    }

    const primaryCenter = centersData.find((c) => c.id === primaryId);
    const secondaryCenters = centersData.filter((c) =>
      secondaryIds.includes(c.id)
    );

    if (!primaryCenter) {
      return NextResponse.json(
        { message: "Primary center not found" },
        { status: 404 }
      );
    }

    // Use transaction for atomic operations
    const result = await db.transaction(async (tx) => {
      const mostRecentSecondary = secondaryCenters.sort(
        (a, b) => (b.modifiedAt ? b.modifiedAt.getTime() : 0) - (a.modifiedAt ? a.modifiedAt.getTime() : 0)
      )[0];

      // Update primary center with the most recent data
      const [updatedPrimary] = await tx
        .update(centers)
        .set({
          name:
            (mostRecentSecondary.modifiedAt ?? 0) > (primaryCenter.modifiedAt ?? 0)
              ? mostRecentSecondary.name
              : primaryCenter.name,
          address:
            (mostRecentSecondary.modifiedAt ?? 0) > (primaryCenter.modifiedAt ?? 0)
              ? mostRecentSecondary.address
              : primaryCenter.address,
          modifiedBy: "system_merge",
          modifiedAt: new Date(),
        })
        .where(eq(centers.id, primaryId))
        .returning();

      // Delete secondary centers
      await tx.delete(centers).where(inArray(centers.id, secondaryIds));

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
