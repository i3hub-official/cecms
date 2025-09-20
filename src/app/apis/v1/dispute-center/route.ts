import { NextRequest } from "next/server";
import { db } from "@/lib/server/db/index";
import { disputeCenters } from "@/lib/server/db/schema";
import { eq } from "drizzle-orm";
import { authenticateRequest } from "@/app/apis/shared/middleware/withAuth";
import { successResponse, errorResponse } from "@/app/apis/shared/lib/response";

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const authResult = await authenticateRequest(request);

  if (!authResult.success) {
    return errorResponse(authResult.error!, authResult.status, undefined, authResult);
  }

  try {
    const { id } = params;

    const [disputeCenter] = await db
      .select()
      .from(disputeCenters)
      .where(eq(disputeCenters.id, id))
      .limit(1);

    if (!disputeCenter) {
      return errorResponse("Dispute center not found", 404, undefined, authResult);
    }

    return successResponse(disputeCenter, undefined, authResult);

  } catch (error) {
    console.error("Dispute center lookup error:", error);
    return errorResponse("Failed to lookup dispute center", 500, undefined, authResult);
  }
}

export async function POST(request: NextRequest) {
  const authResult = await authenticateRequest(request);

  if (!authResult.success) {
    return errorResponse(authResult.error!, authResult.status, undefined, authResult);
  }

  try {
    const body = await request.json();
    
    // Add validation logic here
    const [newDisputeCenter] = await db
      .insert(disputeCenters)
      .values(body)
      .returning();

    return successResponse(newDisputeCenter, undefined, authResult);

  } catch (error) {
    console.error("Dispute center creation error:", error);
    return errorResponse("Failed to create dispute center", 500, undefined, authResult);
  }
}