// Example: src/app/api/v1/data/route.ts
import { NextRequest, NextResponse } from "next/server";
import { authenticateApiRequest } from "@/lib/middleware/api-auth";

export async function GET(request: NextRequest) {
  // Authenticate with API key
  const authResult = await authenticateApiRequest(request);

  if (!authResult.success) {
    return NextResponse.json(
      { error: authResult.error },
      { status: authResult.status }
    );
  }

  // Your protected logic here
  return NextResponse.json({
    success: true,
    data: { message: "Protected data accessed successfully" },
    user: authResult.user,
  });
}
