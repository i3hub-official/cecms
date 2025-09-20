import { NextRequest } from "next/server";
import { db } from "@/lib/server/db/index";
import { centers } from "@/lib/server/db/schema";
import { eq, ilike, and } from "drizzle-orm";
import { authenticateRequest } from "@/app/apis/v1/withAuth";
import { successResponse, errorResponse } from "../../shared/lib/reponse";

export async function GET(request: NextRequest) {
  const authResult = await authenticateRequest(request);

  if (!authResult.success) {
    return errorResponse(
      authResult.error!,
      authResult.status,
      undefined,
      authResult
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const number = searchParams.get("number");

    if (!number) {
      return errorResponse(
        "Center number is required",
        400,
        undefined,
        authResult
      );
    }

    const [center] = await db
      .select({
        id: centers.id,
        number: centers.number,
        name: centers.name,
        address: centers.address,
        state: centers.state,
        lga: centers.lga,
        isActive: centers.isActive,
      })
      .from(centers)
      .where(and(ilike(centers.number, number), eq(centers.isActive, true)))
      .limit(1);

    if (!center) {
      return errorResponse("Center not found", 404, undefined, authResult);
    }

    return successResponse(center, undefined, authResult);
  } catch (error) {
    console.error("Center lookup error:", error);
    return errorResponse("Failed to lookup center", 500, undefined, authResult);
  }
}
