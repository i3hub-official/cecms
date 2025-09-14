// app/api/centers/merge/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const { primaryId, secondaryIds } = await request.json();

    if (!primaryId || !secondaryIds || !Array.isArray(secondaryIds)) {
      return NextResponse.json(
        { message: 'Invalid merge request' },
        { status: 400 }
      );
    }

    // Get all centers
    const allCenterIds = [primaryId, ...secondaryIds];
    const centers = await prisma.center.findMany({
      where: { id: { in: allCenterIds } }
    });

    if (centers.length !== allCenterIds.length) {
      return NextResponse.json(
        { message: 'Some centers not found' },
        { status: 404 }
      );
    }

    const primaryCenter = centers.find(c => c.id === primaryId);
    const secondaryCenters = centers.filter(c => secondaryIds.includes(c.id));

    if (!primaryCenter) {
      return NextResponse.json(
        { message: 'Primary center not found' },
        { status: 404 }
      );
    }

    // Use transaction to ensure data consistency
    const result = await prisma.$transaction(async (tx) => {
      // Update primary center with merged data (keep the most recent information)
      const mostRecentSecondary = secondaryCenters
        .sort((a, b) => new Date(b.modifiedAt).getTime() - new Date(a.modifiedAt).getTime())[0];

      const updatedPrimary = await tx.center.update({
        where: { id: primaryId },
        data: {
          // Keep primary center's data unless secondary has more recent info
          name: mostRecentSecondary.modifiedAt > primaryCenter.modifiedAt 
            ? mostRecentSecondary.name 
            : primaryCenter.name,
          address: mostRecentSecondary.modifiedAt > primaryCenter.modifiedAt 
            ? mostRecentSecondary.address 
            : primaryCenter.address,
          modifiedBy: 'system_merge',
        },
      });

      // Delete secondary centers
      await tx.center.deleteMany({
        where: { id: { in: secondaryIds } }
      });

      return updatedPrimary;
    });

    return NextResponse.json(result);

  } catch (error) {
    console.error('Error merging centers:', error);
    return NextResponse.json(
      { message: 'Failed to merge centers', error },
      { status: 500 }
    );
  }
}
