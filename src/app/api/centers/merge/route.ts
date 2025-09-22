// src/app/api/centers/merge/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/server/db/index";
import { centers } from "@/lib/server/db/schema";
import { getUserFromCookies } from "@/lib/auth";
import { eq, inArray } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromCookies(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const {
      primaryId,
      secondaryIds,
    }: { primaryId: string; secondaryIds: string[] } = await request.json();

    if (!primaryId || !secondaryIds?.length) {
      return NextResponse.json(
        { message: "Primary center and secondary centers are required" },
        { status: 400 }
      );
    }

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

    const mergedCenter = await db.transaction(async (tx) => {
      // Use the most recently modified data from secondary centers
      const mostRecentSecondary = secondaryCenters.sort(
        (a, b) =>
          (b.modifiedAt?.getTime() ?? 0) - (a.modifiedAt?.getTime() ?? 0)
      )[0];

      const [updatedPrimary] = await tx
        .update(centers)
        .set({
          name:
            (mostRecentSecondary.modifiedAt?.getTime() ?? 0) >
            (primaryCenter.modifiedAt?.getTime() ?? 0)
              ? mostRecentSecondary.name
              : primaryCenter.name,
          address:
            (mostRecentSecondary.modifiedAt?.getTime() ?? 0) >
            (primaryCenter.modifiedAt?.getTime() ?? 0)
              ? mostRecentSecondary.address
              : primaryCenter.address,
          modifiedBy: user.email,
          modifiedAt: new Date(),
        })
        .where(eq(centers.id, primaryId))
        .returning();

      // Delete secondary centers
      await tx.delete(centers).where(inArray(centers.id, secondaryIds));

      return updatedPrimary;
    });

    return NextResponse.json({
      success: true,
      message: "Centers merged successfully",
      data: mergedCenter,
    });
  } catch (error) {
    console.error("Error merging centers:", error);
    return NextResponse.json(
      { message: "Failed to merge centers", error },
      { status: 500 }
    );
  }
}
