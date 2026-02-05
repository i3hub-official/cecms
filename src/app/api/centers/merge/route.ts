// src/app/api/centers/merge/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/server/db/index";
import { centers } from "@/lib/server/db/schema";
import { getUserFromCookies } from "@/lib/auth";
import { eq, inArray, and } from "drizzle-orm";

interface MergeRequest {
  primaryId: string;
  secondaryIds: string[];
  strategy?: "most_recent" | "keep_primary" | "merge_fields";
  fieldPreferences?: {
    name?: "primary" | "secondary" | "most_recent";
    address?: "primary" | "secondary" | "most_recent";
    [key: string]: string | undefined;
  };
}

export async function POST(request: NextRequest) {
  try {
    // Get user from cookies using simplified auth
    const user = await getUserFromCookies(request);
    
    if (!user) {
      console.log("Merge centers API: Unauthorized access attempt");
      return NextResponse.json(
        { 
          success: false,
          error: "Unauthorized",
          message: "Please log in to merge centers"
        }, 
        { status: 401 }
      );
    }

    // Check if user has permission (superadmin only for merging)
    if (user.role !== 'superadmin') {
      return NextResponse.json(
        { 
          success: false,
          error: "Forbidden",
          message: "Only superadmins can merge centers"
        }, 
        { status: 403 }
      );
    }

    console.log(`Merge centers API: Authorized access for superadmin ${user.email}`);

    // Parse and validate request body
    const body = await request.json();
    const { primaryId, secondaryIds, strategy = "most_recent", fieldPreferences = {} }: MergeRequest = body;

    // Validate required fields
    if (!primaryId) {
      return NextResponse.json(
        { 
          success: false,
          error: "Missing parameter",
          message: "Primary center ID is required"
        },
        { status: 400 }
      );
    }

    if (!secondaryIds || !Array.isArray(secondaryIds) || secondaryIds.length === 0) {
      return NextResponse.json(
        { 
          success: false,
          error: "Missing parameter",
          message: "At least one secondary center ID is required"
        },
        { status: 400 }
      );
    }

    // Validate no duplicate IDs
    const allIds = [primaryId, ...secondaryIds];
    const uniqueIds = [...new Set(allIds)];
    if (uniqueIds.length !== allIds.length) {
      return NextResponse.json(
        { 
          success: false,
          error: "Invalid request",
          message: "Duplicate center IDs detected"
        },
        { status: 400 }
      );
    }

    console.log(`Merging ${secondaryIds.length} centers into primary center ${primaryId}`);

    // Fetch all centers involved in the merge
    const centersData = await db
      .select()
      .from(centers)
      .where(inArray(centers.id, allIds));

    // Check if all centers exist
    if (centersData.length !== allIds.length) {
      const foundIds = centersData.map(c => c.id);
      const missingIds = allIds.filter(id => !foundIds.includes(id));
      
      console.log(`Some centers not found: ${missingIds.join(', ')}`);
      
      return NextResponse.json(
        { 
          success: false,
          error: "Centers not found",
          message: `The following centers were not found: ${missingIds.join(', ')}`,
          missingIds
        },
        { status: 404 }
      );
    }

    const primaryCenter = centersData.find((c) => c.id === primaryId);
    const secondaryCenters = centersData.filter((c) => secondaryIds.includes(c.id));

    if (!primaryCenter) {
      return NextResponse.json(
        { 
          success: false,
          error: "Primary center not found",
          message: "Primary center not found in database"
        },
        { status: 404 }
      );
    }

    // Prevent merging active centers into inactive ones
    if (!primaryCenter.isActive) {
      return NextResponse.json(
        { 
          success: false,
          error: "Invalid merge operation",
          message: "Cannot merge centers into an inactive primary center"
        },
        { status: 400 }
      );
    }

    // Check for duplicate center numbers among secondaries
    const centerNumbers = new Set<string>();
    const duplicateNumbers: string[] = [];
    
    secondaryCenters.forEach(center => {
      if (centerNumbers.has(center.number)) {
        duplicateNumbers.push(center.number);
      } else {
        centerNumbers.add(center.number);
      }
    });

    if (duplicateNumbers.length > 0) {
      console.log(`Duplicate center numbers found: ${duplicateNumbers.join(', ')}`);
    }

    console.log(`Starting merge transaction for ${secondaryCenters.length} secondary centers`);

    // Perform merge transaction
    const mergedCenter = await db.transaction(async (tx) => {
      // Determine which data to use based on strategy
      const mostRecentSecondary = secondaryCenters.sort(
        (a, b) =>
          (b.modifiedAt?.getTime() ?? 0) - (a.modifiedAt?.getTime() ?? 0)
      )[0];

      // Prepare update data
      const updateData: any = {
        modifiedBy: user.email,
        modifiedAt: new Date(),
      };

      // Apply strategy for each field
      if (strategy === "most_recent") {
        const mostRecentCenter = [primaryCenter, ...secondaryCenters].sort(
          (a, b) => (b.modifiedAt?.getTime() ?? 0) - (a.modifiedAt?.getTime() ?? 0)
        )[0];

        updateData.name = mostRecentCenter.name;
        updateData.address = mostRecentCenter.address || primaryCenter.address;
        
        // Use the most complete data for optional fields
        if (mostRecentCenter.address && !primaryCenter.address) {
          updateData.address = mostRecentCenter.address;
        }
      } else if (strategy === "merge_fields") {
        // Use field-specific preferences
        const namePref = fieldPreferences.name || "most_recent";
        const addressPref = fieldPreferences.address || "most_recent";

        updateData.name = getFieldValue(namePref, "name", primaryCenter, mostRecentSecondary);
        updateData.address = getFieldValue(addressPref, "address", primaryCenter, mostRecentSecondary);
      } else {
        // keep_primary strategy - keep primary data
        updateData.name = primaryCenter.name;
        updateData.address = primaryCenter.address;
      }

      // Update the primary center
      const [updatedPrimary] = await tx
        .update(centers)
        .set(updateData)
        .where(eq(centers.id, primaryId))
        .returning();

      if (!updatedPrimary) {
        throw new Error("Failed to update primary center");
      }

      // Mark secondary centers as inactive instead of deleting
      // (soft delete for audit purposes)
      await tx
        .update(centers)
        .set({
          isActive: false,
          mergedInto: primaryId,
          modifiedBy: user.email,
          modifiedAt: new Date(),
        })
        .where(inArray(centers.id, secondaryIds));

      console.log(`Marked ${secondaryIds.length} centers as inactive (merged into ${primaryId})`);

      return updatedPrimary;
    });

    console.log(`Merge completed successfully for center ${primaryId}`);

    return NextResponse.json({
      success: true,
      message: "Centers merged successfully",
      data: {
        primaryCenter: mergedCenter,
        mergedCount: secondaryIds.length,
        strategy,
        fieldPreferences,
      },
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error merging centers:", error);
    
    // Handle specific error types
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { 
          success: false,
          error: "Invalid JSON",
          message: "The request body contains invalid JSON"
        },
        { status: 400 }
      );
    }

    // Handle database transaction errors
    if (error instanceof Error && error.message.includes("transaction")) {
      return NextResponse.json(
        { 
          success: false,
          error: "Transaction failed",
          message: "The merge operation failed due to a database transaction error"
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { 
        success: false,
        error: "Failed to merge centers",
        message: "An internal server error occurred during the merge operation",
        details: process.env.NODE_ENV === "development" && error instanceof Error 
          ? error.message 
          : undefined,
      },
      { status: 500 }
    );
  }
}

// Helper function to get field value based on preference
function getFieldValue(
  preference: string,
  fieldName: string,
  primary: any,
  mostRecentSecondary: any
): string {
  switch (preference) {
    case "primary":
      return primary[fieldName] || "";
    case "secondary":
      return mostRecentSecondary[fieldName] || primary[fieldName] || "";
    case "most_recent":
    default:
      const primaryTime = primary.modifiedAt?.getTime() ?? 0;
      const secondaryTime = mostRecentSecondary.modifiedAt?.getTime() ?? 0;
      return secondaryTime > primaryTime 
        ? (mostRecentSecondary[fieldName] || primary[fieldName] || "")
        : (primary[fieldName] || "");
  }
}

// Handle OPTIONS for CORS
export async function OPTIONS() {
  return NextResponse.json(
    {},
    {
      status: 200,
      headers: {
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization, Cookie",
        "Access-Control-Allow-Credentials": "true",
        "Access-Control-Max-Age": "86400",
      },
    }
  );
}