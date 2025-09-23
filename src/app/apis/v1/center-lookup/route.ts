import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/server/db";
import { centers, apiKeys } from "@/lib/server/db/schema";
import { eq, and, ilike, sql } from "drizzle-orm";
import { verifyToken } from "@/lib/utils/tokens";
import {
  successResponse,
  errorResponse,
  getStatusCodeForError,
  ErrorCodes,
} from "@/app/apis/shared/lib/response";

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      const err = errorResponse(
        ErrorCodes.UNAUTHORIZED,
        "Missing or invalid Authorization header"
      );
      return NextResponse.json(err, {
        status: getStatusCodeForError(err.error.code),
      });
    }

    const providedKey = authHeader.replace("Bearer ", "").trim();
    const prefix = providedKey.slice(0, 8);

    const [storedKey] = await db
      .select()
      .from(apiKeys)
      .where(and(eq(apiKeys.prefix, prefix), eq(apiKeys.isActive, true)))
      .limit(1);

    if (!storedKey) {
      const err = errorResponse(ErrorCodes.API_KEY_INVALID, "Invalid API key");
      return NextResponse.json(err, {
        status: getStatusCodeForError(err.error.code),
      });
    }

    const isValid = await verifyToken(providedKey, storedKey.key);
    if (!isValid) {
      const err = errorResponse(ErrorCodes.API_KEY_INVALID, "Invalid API key");
      return NextResponse.json(err, {
        status: getStatusCodeForError(err.error.code),
      });
    }

    if (storedKey.expiresAt && storedKey.expiresAt < new Date()) {
      const err = errorResponse(ErrorCodes.API_KEY_EXPIRED, "API key expired");
      return NextResponse.json(err, {
        status: getStatusCodeForError(err.error.code),
      });
    }

    if (!storedKey.canRead) {
      const err = errorResponse(ErrorCodes.FORBIDDEN, "Read access denied");
      return NextResponse.json(err, {
        status: getStatusCodeForError(err.error.code),
      });
    }

    if (
      storedKey.allowedEndpoints !== "*" &&
      !storedKey.allowedEndpoints.includes("/apis/v1/center-lookup")
    ) {
      const err = errorResponse(ErrorCodes.FORBIDDEN, "Endpoint access denied");
      return NextResponse.json(err, {
        status: getStatusCodeForError(err.error.code),
      });
    }

    const { searchParams } = new URL(request.url);
    const number = searchParams.get("number");
    if (!number) {
      const err = errorResponse(
        ErrorCodes.INVALID_INPUT,
        "Center number is required"
      );
      return NextResponse.json(err, {
        status: getStatusCodeForError(err.error.code),
      });
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
      const err = errorResponse(ErrorCodes.NOT_FOUND, "Center not found");
      return NextResponse.json(err, {
        status: getStatusCodeForError(err.error.code),
      });
    }

    await db
      .update(apiKeys)
      .set({
        lastUsed: new Date(),
        usageCount: sql`${apiKeys.usageCount} + 1`,
      })
      .where(eq(apiKeys.id, storedKey.id));

    const res = successResponse(center, "Center found");
    return NextResponse.json(res, { status: 200 });
  } catch (error) {
    console.error("Center lookup error:", error);
    const err = errorResponse(
      ErrorCodes.INTERNAL_ERROR,
      "Failed to lookup center"
    );
    return NextResponse.json(err, {
      status: getStatusCodeForError(err.error.code),
    });
  }
}
